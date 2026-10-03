"""
Moonwitness ERP — Project & Workload Models (project.project)
Links customer subscriptions directly to Universe Runner containers & processes.
"""
from services.erp.core.registry import Model
from services.erp.core.fields import (
    CharField, TextField, Many2One, Selection
)


class ProjectProject(Model):
    _name = "project.project"
    _description = "Cloud Compute Project / Managed Customer Workload"

    name = CharField(max_length=255, required=True, string="Project / Workload Name")
    partner_id = Many2One("res.partner", required=True, string="Client / Customer")
    subscription_id = Many2One("sale.subscription", string="Linked Subscription")
    
    # Kaitan langsung ke Universe Runner (:5160)
    runner_workload_id = CharField(max_length=128, string="Runner Workload / Container ID")
    runner_deploy_mode = Selection([
        ("docker_image", "Docker Hub Image"),
        ("github_repo", "GitHub Repository"),
        ("dockerfile", "Raw Dockerfile"),
        ("compose", "Docker Compose Stack")
    ], default="docker_image", string="Deployment Mode")

    status = Selection([
        ("provisioning", "Provisioning"),
        ("running", "Running"),
        ("stopped", "Stopped"),
        ("error", "Error")
    ], default="provisioning", index=True, string="Workload Status")

    notes = TextField(string="Technical Specifications & Notes")
