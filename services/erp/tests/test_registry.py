import unittest
from types import SimpleNamespace
from unittest.mock import patch
from datetime import datetime, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import MetaData, create_engine, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from services.erp.core.fields import (
    CharField, DecimalField, Selection, Many2One, One2Many, Many2Many,
    ComputedField, RelatedField,
)
from services.erp.core.registry import AddonManifest, ERPRegistry, Model
from services.erp.core.config import settings
from services.erp.core.security import CredentialEncryptionUnavailable, decrypt_secret, encrypt_secret
from services.erp.core.billing import billing_boundary, prorate_amount
from services.erp.core.subscriptions import (
    InvalidSubscriptionTransition,
    transition_subscription,
)


class RegistryTests(unittest.TestCase):
    def test_subscription_transition_contract_allows_and_rejects_legal_states(self):
        subscription = SimpleNamespace(state="suspended")
        previous = transition_subscription(subscription, "pending_activation")
        self.assertEqual(previous, "suspended")
        self.assertEqual(subscription.state, "pending_activation")

        previous = transition_subscription(subscription, "active")
        self.assertEqual(previous, "pending_activation")
        self.assertEqual(subscription.state, "active")

        subscription.state = "cancelled"
        with self.assertRaisesRegex(InvalidSubscriptionTransition, "cancelled.*active"):
            transition_subscription(subscription, "active")
        self.assertEqual(subscription.state, "cancelled")

    def test_numeric_bounds_validate_models_and_compile_database_constraints(self):
        registry = ERPRegistry()

        class BoundedLine(Model):
            _name = "test.bounded_line"
            quantity = DecimalField(
                required=True, minimum=0, exclusive_minimum=True
            )

        registry.register_addon(AddonManifest("bounded"), [BoundedLine])
        registry.compile()
        Bounded = registry.get_model("test.bounded_line")
        self.assertTrue(any(
            getattr(constraint, "name", "").endswith("quantity_range")
            for constraint in Bounded.__table__.constraints
        ))
        field_description = registry.describe()["models"]["test.bounded_line"]["fields"]["quantity"]
        self.assertEqual(field_description["minimum"], 0)
        self.assertTrue(field_description["exclusive_minimum"])
        with self.assertRaisesRegex(ValueError, "quantity must be > 0"):
            Bounded(quantity=Decimal("0"))

        engine = create_engine("sqlite:///:memory:")
        registry.metadata.create_all(engine)
        with self.assertRaises(IntegrityError):
            with engine.begin() as connection:
                connection.execute(text(
                    "INSERT INTO test_bounded_line "
                    "(id, created_at, updated_at, quantity) "
                    "VALUES ('bad', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)"
                ))
        engine.dispose()

    def test_registry_instances_receive_isolated_metadata_by_default(self):
        first = ERPRegistry()
        second = ERPRegistry()
        self.assertIsNot(first.metadata, second.metadata)

    def test_addon_extension_compiles_deterministically_and_exposes_metadata(self):
        registry = ERPRegistry(MetaData())

        class Partner(Model):
            _name = "res.partner"
            name = CharField(required=True)

        class PartnerExtension(Model):
            _inherit = "res.partner"
            external_ref = CharField(index=True)

        registry.register_addon(AddonManifest("base"), [Partner])
        registry.register_addon(
            AddonManifest("crm", depends=["base"]), [PartnerExtension]
        )
        registry.compile()

        partner = registry.get_model("res.partner")
        self.assertEqual(
            set(partner.__table__.columns.keys()),
            {"id", "created_at", "updated_at", "name", "external_ref"},
        )
        description = registry.describe()
        self.assertEqual(
            [addon["name"] for addon in description["addons"]], ["base", "crm"]
        )
        self.assertEqual(
            description["models"]["res.partner"]["fields"]["external_ref"]["owner"],
            "crm",
        )


    def test_registry_rejects_duplicate_addon_and_missing_dependency(self):
        registry = ERPRegistry(MetaData())
        registry.register_addon(AddonManifest("base"), [])
        with self.assertRaisesRegex(ValueError, "already been registered"):
            registry.register_addon(AddonManifest("base"), [])

        broken = ERPRegistry(MetaData())
        broken.register_addon(AddonManifest("crm", depends=["base"]), [])
        with self.assertRaisesRegex(ValueError, "Missing dependency"):
            broken.compile()


    def test_registry_rejects_field_collision_instead_of_last_writer_wins(self):
        registry = ERPRegistry(MetaData())

        class Partner(Model):
            _name = "res.partner"
            name = CharField()

        class PartnerExtension(Model):
            _inherit = "res.partner"
            name = CharField()

        registry.register_addon(AddonManifest("base"), [Partner])
        registry.register_addon(
            AddonManifest("crm", depends=["base"]), [PartnerExtension]
        )
        with self.assertRaisesRegex(ValueError, "Field collision"):
            registry.compile()


    def test_registry_rejects_extension_without_dependency_on_model_owner(self):
        registry = ERPRegistry(MetaData())

        class Partner(Model):
            _name = "res.partner"
            name = CharField()

        class PartnerExtension(Model):
            _inherit = "res.partner"
            external_ref = CharField()

        registry.register_addon(AddonManifest("base"), [Partner])
        registry.register_addon(AddonManifest("crm"), [PartnerExtension])
        with self.assertRaisesRegex(ValueError, "does not depend on owner addon"):
            registry.compile()

    def test_inherit_method_overrides_chain_through_cooperative_super(self):
        registry = ERPRegistry(MetaData())

        class Partner(Model):
            _name = "res.partner"
            name = CharField()

            def extension_trace(self):
                return ["base"]

        class CrmExtension(Model):
            _inherit = "res.partner"

            def extension_trace(self):
                return super().extension_trace() + ["crm"]

        class IspExtension(Model):
            _inherit = "res.partner"

            def extension_trace(self):
                return super().extension_trace() + ["isp"]

        registry.register_addon(AddonManifest("base"), [Partner])
        registry.register_addon(AddonManifest("crm", depends=["base"]), [CrmExtension])
        registry.register_addon(AddonManifest("isp", depends=["crm"]), [IspExtension])
        registry.compile()

        partner = registry.get_model("res.partner")(name="Extension chain")
        self.assertEqual(partner.extension_trace(), ["base", "crm", "isp"])

    def test_many_to_one_one_to_many_and_many_to_many_relationships(self):
        registry = ERPRegistry(MetaData())

        class Parent(Model):
            _name = "test.parent"
            name = CharField(required=True)
            children = One2Many("test.child", inverse_field="parent_id")
            tags = Many2Many(
                "test.tag",
                relation_table="test_parent_tag_rel",
                source_column="parent_id",
                target_column="tag_id",
            )

        class Child(Model):
            _name = "test.child"
            name = CharField(required=True)
            parent_id = Many2One("test.parent", required=True, ondelete="CASCADE")

        class Tag(Model):
            _name = "test.tag"
            name = CharField(required=True)

        registry.register_addon(AddonManifest("test"), [Parent, Child, Tag])
        registry.compile()
        engine = create_engine("sqlite:///:memory:")
        registry.metadata.create_all(engine)
        ParentModel = registry.get_model("test.parent")
        ChildModel = registry.get_model("test.child")
        TagModel = registry.get_model("test.tag")

        with Session(engine) as session:
            parent = ParentModel(name="parent")
            tag = TagModel(name="priority")
            parent.children.append(ChildModel(name="child"))
            parent.tags.append(tag)
            session.add(parent)
            session.commit()
            parent_id = parent.id

        with Session(engine) as session:
            parent = session.scalar(
                select(ParentModel)
                .options(selectinload(ParentModel.children), selectinload(ParentModel.tags))
                .where(ParentModel.id == parent_id)
            )
            self.assertEqual([child.name for child in parent.children], ["child"])
            self.assertEqual([tag.name for tag in parent.tags], ["priority"])
            child = session.scalar(
                select(ChildModel).options(selectinload(ChildModel.parent))
            )
            self.assertEqual(child.parent.name, "parent")

        engine.dispose()

    def test_required_relationships_and_addon_validators_run_before_flush(self):
        registry = ERPRegistry(MetaData())

        class Parent(Model):
            _name = "test.validated_parent"
            name = CharField(required=True)

        class Child(Model):
            _name = "test.validated_child"
            name = CharField(required=True)
            parent_id = Many2One("test.validated_parent", required=True)

            def validate_model(self):
                if self.name == "invalid":
                    raise ValueError("child name is forbidden")

        registry.register_addon(AddonManifest("test"), [Parent, Child])
        registry.compile()
        ParentModel = registry.get_model("test.validated_parent")
        ChildModel = registry.get_model("test.validated_child")
        engine = create_engine("sqlite:///:memory:")
        registry.metadata.create_all(engine)

        with Session(engine) as session:
            with self.assertRaisesRegex(ValueError, "requires a related"):
                session.add(ChildModel(name="orphan"))
                session.flush()
            session.rollback()

            parent = ParentModel(name="parent")
            child = ChildModel(name="child", parent=parent)
            session.add(child)
            session.flush()
            self.assertIsNotNone(child.parent_id)

            session.add(ChildModel(name="invalid", parent=parent))
            with self.assertRaisesRegex(ValueError, "child name is forbidden"):
                session.flush()

        engine.dispose()

    def test_computed_and_related_fields_are_read_only_and_serializable(self):
        registry = ERPRegistry(MetaData())

        class Parent(Model):
            _name = "test.computed_parent"
            name = CharField(required=True)

        class Child(Model):
            _name = "test.computed_child"
            parent_id = Many2One("test.computed_parent", required=True)
            name = CharField(required=True)
            label = ComputedField(lambda row: f"{row.parent.name}: {row.name}", depends=["parent", "name"])
            parent_name = RelatedField("parent.name", string="Parent Name")

        registry.register_addon(AddonManifest("test"), [Parent, Child])
        registry.compile()
        ParentModel = registry.get_model("test.computed_parent")
        ChildModel = registry.get_model("test.computed_child")
        parent = ParentModel(name="Parent")
        child = ChildModel(name="Child", parent=parent)

        self.assertEqual(child.label, "Parent: Child")
        self.assertEqual(child.parent_name, "Parent")
        self.assertEqual(child.to_dict()["label"], "Parent: Child")
        self.assertTrue(
            registry.describe()["models"]["test.computed_child"]["fields"]["label"]["read_only"]
        )
        with self.assertRaisesRegex(TypeError, "read-only computed field"):
            ChildModel(name="Child", parent=parent, label="override")

    def test_compiled_model_validates_required_types_and_selection_values(self):
        registry = ERPRegistry(MetaData())

        class Contract(Model):
            _name = "test.contract"
            name = CharField(required=True, max_length=8)
            state = Selection([("draft", "Draft"), ("active", "Active")], required=True)
            amount = DecimalField()

        registry.register_addon(AddonManifest("test"), [Contract])
        registry.compile()
        ContractModel = registry.get_model("test.contract")

        with self.assertRaisesRegex(ValueError, "name is required"):
            ContractModel(state="draft")
        with self.assertRaisesRegex(ValueError, "state must be one of"):
            ContractModel(name="short", state="unknown")
        with self.assertRaisesRegex(TypeError, "floats are rejected"):
            ContractModel(name="short", state="draft", amount=1.25)
        with self.assertRaisesRegex(ValueError, "maximum length"):
            ContractModel(name="too-long-name", state="draft")

    def test_sensitive_fields_are_omitted_from_model_serialization(self):
        registry = ERPRegistry(MetaData())

        class Partner(Model):
            _name = "res.partner"
            name = CharField()
            credential_ciphertext = CharField(sensitive=True)

        registry.register_addon(AddonManifest("base"), [Partner])
        registry.compile()
        partner = registry.get_model("res.partner")(
            name="Example", credential_ciphertext="encrypted-value"
        )
        self.assertNotIn("credential_ciphertext", partner.to_dict())

    def test_credentials_are_encrypted_and_reject_missing_or_wrong_keys(self):
        test_key = "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA="
        with patch.object(settings, "credential_encryption_key", test_key):
            ciphertext = encrypt_secret("user provided secret")
            self.assertNotEqual(ciphertext, "user provided secret")
            self.assertEqual(decrypt_secret(ciphertext), "user provided secret")
            with self.assertRaises(CredentialEncryptionUnavailable):
                decrypt_secret(ciphertext + "corrupt")

    def test_month_end_anchor_is_preserved_after_short_month(self):
        january = datetime(2024, 1, 31, 12, tzinfo=timezone.utc)
        february = billing_boundary(
            january, anchor_day=31, interval="monthly", billing_timezone="UTC"
        )
        march = billing_boundary(
            february, anchor_day=31, interval="monthly", billing_timezone="UTC"
        )
        self.assertEqual(february, datetime(2024, 2, 29, 12, tzinfo=timezone.utc))
        self.assertEqual(march, datetime(2024, 3, 31, 12, tzinfo=timezone.utc))

    def test_billing_boundary_resolves_nonexistent_dst_wall_time(self):
        february = datetime(2024, 2, 10, 7, 30, tzinfo=timezone.utc)
        boundary = billing_boundary(
            february,
            anchor_day=10,
            interval="monthly",
            billing_timezone="America/New_York",
        )
        self.assertEqual(
            boundary.astimezone(ZoneInfo("America/New_York")).hour,
            3,
        )
        self.assertEqual(
            boundary.astimezone(ZoneInfo("America/New_York")).minute,
            0,
        )

    def test_proration_uses_decimal_elapsed_time_and_currency_rounding(self):
        start = datetime(2024, 1, 1, tzinfo=timezone.utc)
        end = datetime(2024, 1, 31, tzinfo=timezone.utc)
        result = prorate_amount(
            Decimal("100.00"),
            period_start=start,
            period_end=end,
            service_start=start,
            service_end=datetime(2024, 1, 16, tzinfo=timezone.utc),
        )
        self.assertEqual(result, Decimal("50.00"))
        self.assertEqual(result.as_tuple().exponent, -2)
