import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import process from 'node:process'

import ts from 'typescript'

const sourceExtensions = new Set(['.tsx', '.jsx'])
const uiMessageCalls = new Set(['alert', 'confirm', 'prompt', 'enqueueSnackbar'])
const validationMessageCalls = new Set(['email', 'minLength', 'maxLength', 'nonEmpty', 'url', 'uuid'])

const uiDataProperties = new Set([
  'title',
  'subtitle',
  'description',
  'placeholder',
  'helperText',
  'tooltip',
  'content',
  'text',
  'message',
  'role',
  'location',
  'status',
  'category',
  'feature',
  'benefit',
  'question',
  'answer',
  'header',
  'footer',
  'caption',
  'chipText',
  'designation',
  'property',
  'joiningDate'
])

const ignoredAttributes = new Set([
  'anchor',
  'aria-hidden',
  'attribute',
  'action',
  'autoComplete',
  'scroll',
  'scrollButtons',
  'accept',
  'className',
  'containerClassName',
  'component',
  'color',
  'dateFormat',
  'direction',
  'data-testid',
  'edge',
  'href',
  'htmlFor',
  'iconClassName',
  'id',
  'aria-controls',
  'aria-labelledby',
  'textColor',
  'indicatorColor',
  'avatarColor',
  'avatarIcon',
  'avatarSkin',
  'chipColor',
  'chipVariant',
  'backgroundColor',
  'textAnchor',
  'dominantBaseline',
  'fontFamily',
  'filter',
  'result',
  'in',
  'in2',
  'operator',
  'transform',
  'valueLabelDisplay',
  'iconPosition',
  'method',
  'name',
  'overlap',
  'ltrIconClass',
  'alignItems',
  'align',
  'alignSelf',
  'orientation',
  'fit',
  'd',
  'fill',
  'fillOpacity',
  'fillRule',
  'stroke',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeLinecap',
  'strokeLinejoin',
  'strokeOpacity',
  'strokeWidth',
  'clipPath',
  'clipRule',
  'viewBox',
  'preserveAspectRatio',
  'vectorEffect',
  'shapeRendering',
  'pointerEvents',
  'stopColor',
  'stopOpacity',
  'xmlns',
  'width',
  'height',
  'folder',
  'fontSize',
  'fontWeight',
  'loading',
  'maxWidth',
  'position',
  'placement',
  'pill',
  'rel',
  'role',
  'round',
  'skin',
  'shape',
  'size',
  'severity',
  'slot',
  'slotProps',
  'src',
  'sx',
  'target',
  'type',
  'value',
  'value',
  'rtlIconClass',
  'variant'
])

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
const isUiText = (value: string) => /\p{L}/u.test(value)

const validateRequiredLocaleKeys = () => {
  const englishPath = resolve(process.cwd(), 'src/data/dictionaries/en.json')
  const indonesianPath = resolve(process.cwd(), 'src/data/dictionaries/id.json')
  const english = JSON.parse(readFileSync(englishPath, 'utf8')) as Record<string, unknown>
  const indonesian = JSON.parse(readFileSync(indonesianPath, 'utf8')) as Record<string, unknown>
  const errors: string[] = []

  const compare = (reference: unknown, translated: unknown, keyPath: string) => {
    if (typeof reference === 'string') {
      if (typeof translated !== 'string') {
        errors.push(`id.json is missing string key "${keyPath}"`)

        return
      }

      const referenceTokens = reference.match(/\{[^{}]+\}/g) ?? []
      const translatedTokens = translated.match(/\{[^{}]+\}/g) ?? []

      if (referenceTokens.sort().join('|') !== translatedTokens.sort().join('|')) {
        errors.push(`Placeholder mismatch for "${keyPath}" in id.json`)
      }

      return
    }

    if (!reference || typeof reference !== 'object' || Array.isArray(reference)) return

    const referenceObject = reference as Record<string, unknown>

    const translatedObject =
      translated && typeof translated === 'object' && !Array.isArray(translated)
        ? (translated as Record<string, unknown>)
        : {}

    for (const [key, value] of Object.entries(referenceObject)) {
      compare(value, translatedObject[key], keyPath ? `${keyPath}.${key}` : key)
    }

    for (const key of Object.keys(translatedObject)) {
      if (!(key in referenceObject)) errors.push(`Unexpected key "${keyPath ? `${keyPath}.` : ''}${key}" in id.json`)
    }
  }

  compare(english, indonesian, '')

  if (errors.length > 0) {
    console.error('English and Indonesian dictionaries must have matching keys and interpolation placeholders:')
    console.error(errors.join('\n'))
    process.exit(1)
  }
}

const validateProfileFixtureKeys = () => {
  const fixturePath = resolve(process.cwd(), 'src/fake-db/pages/userProfile.ts')
  const fixtureText = readFileSync(fixturePath, 'utf8')
  const englishPath = resolve(process.cwd(), 'src/data/dictionaries/en.json')
  const english = JSON.parse(readFileSync(englishPath, 'utf8')) as Record<string, Record<string, string>>
  const commonKeys = new Set(Object.keys(english.common ?? {}))
  const errors: string[] = []
  const pattern = /(?:title|description|chipText|subtitle|designation|location|joiningDate|property):\s*'([^']+)'/g

  for (const match of fixtureText.matchAll(pattern)) {
    const value = match[1]

    if (!commonKeys.has(value))
      errors.push(`src/fake-db/pages/userProfile.ts contains untranslated content key/value "${value}"`)
  }

  if (errors.length > 0) {
    console.error('Profile fixture user-facing copy must use a key from the common dictionary:')
    console.error(errors.join('\n'))
    process.exit(1)
  }
}

const validateFrontLayoutLiterals = () => {
  const files = [
    'src/components/layout/front-pages/Header.tsx',
    'src/components/layout/front-pages/FrontMenu.tsx',
    'src/components/layout/front-pages/DropdownMenu.tsx',
    'src/components/layout/front-pages/Footer.tsx'
  ]

  const errors: string[] = []

  for (const relativePath of files) {
    const path = resolve(process.cwd(), relativePath)
    const sourceText = readFileSync(path, 'utf8')
    const sourceFile = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    const walk = (node: ts.Node) => {
      if (
        ts.isJsxText(node) &&
        isUiText(node.text) &&
        (!ts.isJsxElement(node.parent) ||
          !['i', 'span'].includes(node.parent.openingElement.tagName.getText(sourceFile))) &&
        !node.text.includes('❤️') &&
        !node.text.includes('Pixinvent')
      ) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))

        errors.push(`${relative(process.cwd(), path)}:${line + 1} has hard-coded visible front-page text`)
      }

      const technicalAttributes = new Set(['anchor'])

      if (
        ts.isJsxAttribute(node) &&
        node.initializer &&
        !ignoredAttributes.has(node.name.getText(sourceFile)) &&
        !technicalAttributes.has(node.name.getText(sourceFile))
      ) {
        const initializer = node.initializer
        const expression = ts.isJsxExpression(initializer) ? initializer.expression : initializer

        if (
          expression &&
          (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) &&
          isUiText(expression.text)
        ) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))

          errors.push(
            `${relative(process.cwd(), path)}:${line + 1} has hard-coded front-page prop "${node.name.getText(sourceFile)}"`
          )
        }
      }

      ts.forEachChild(node, walk)
    }

    walk(sourceFile)
  }

  if (errors.length > 0) {
    console.error('Front-page navigation and shell copy must use the translation system:')
    console.error(errors.join('\n'))
    process.exit(1)
  }
}

const validateFrontLandingLiterals = () => {
  const dataFiles = ['src/fake-db/pages/pricing.ts']
  const technicalAttributeNames = new Set(['d', 'xmlns'])

  const technicalPropertyNames = new Set([
    'alignItems',
    'anchor',
    'asset',
    'avatarSrc',
    'border',
    'borderColor',
    'borderRadius',
    'className',
    'color',
    'cursor',
    'd',
    'display',
    'fill',
    'flexDirection',
    'height',
    'id',
    'img',
    'imgSrc',
    'inStock',
    'justifyContent',
    'meta',
    'name',
    'origin',
    'overflow',
    'plan',
    'position',
    'rating',
    'size',
    'slot',
    'src',
    'target',
    'type',
    'value',
    'variant',
    'width',
    'xmlns',
    'scrollButtons',
    'scroll',
    'placeholder',
    'aria-label',
    'aria-hidden',
    'image',
    'skin',
    'textAlign'
  ])

  const files = [
    'src/views/front-pages/landing-page/HeroSection.tsx',
    'src/views/front-pages/landing-page/UsefulFeature.tsx',
    'src/views/front-pages/landing-page/CustomerReviews.tsx',
    'src/views/front-pages/landing-page/OurTeam.tsx',
    'src/views/front-pages/landing-page/Pricing.tsx',
    'src/views/front-pages/landing-page/ProductStat.tsx',
    'src/views/front-pages/landing-page/Faqs.tsx',
    'src/views/front-pages/landing-page/GetStarted.tsx',
    'src/views/front-pages/landing-page/ContactUs.tsx',
    'src/views/front-pages/pricing/Plans.tsx',
    'src/views/front-pages/pricing/Faqs.tsx',
    'src/views/front-pages/pricing/FreeTrial.tsx',
    'src/views/front-pages/pricing/PricingSection.tsx',
    'src/components/pricing/index.tsx',
    'src/components/pricing/PlanDetails.tsx',
    'src/views/front-pages/Payment.tsx',
    'src/views/front-pages/CheckoutPage.tsx',
    'src/views/pages/wizard-examples/checkout/index.tsx',
    'src/views/pages/wizard-examples/checkout/StepCart.tsx',
    'src/views/pages/wizard-examples/checkout/StepAddress.tsx',
    'src/views/pages/wizard-examples/checkout/StepPayment.tsx',
    'src/views/pages/wizard-examples/checkout/StepConfirmation.tsx',
    'src/components/dialogs/add-edit-address/index.tsx',
    'src/components/pricing/index.tsx',
    'src/components/pricing/PlanDetails.tsx',
    'src/@core/components/custom-inputs/Horizontal.tsx',
    'src/@core/components/custom-inputs/Vertical.tsx'
  ]

  const errors: string[] = []
  const englishPath = resolve(process.cwd(), 'src/data/dictionaries/en.json')
  const english = JSON.parse(readFileSync(englishPath, 'utf8')) as Record<string, Record<string, string>>
  const commonKeys = new Set(Object.keys(english.common ?? {}))

  for (const relativePath of files) {
    const path = resolve(process.cwd(), relativePath)
    const sourceText = readFileSync(path, 'utf8')
    const sourceFile = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    const walk = (node: ts.Node) => {
      if (ts.isJsxText(node) && isUiText(node.text)) {
        const text = normalize(node.text)

        if (text && !ts.isJsxElement(node.parent)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))

          errors.push(
            `${relative(process.cwd(), path)}:${line + 1} has hard-coded visible landing-page text: “${text}”`
          )
        }
      }

      if (
        ts.isJsxAttribute(node) &&
        node.initializer &&
        !ignoredAttributes.has(node.name.getText(sourceFile)) &&
        !technicalAttributeNames.has(node.name.getText(sourceFile))
      ) {
        const initializer = node.initializer
        const expression = ts.isJsxExpression(initializer) ? initializer.expression : initializer

        if (
          expression &&
          (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) &&
          isUiText(expression.text)
        ) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))

          errors.push(
            `${relative(process.cwd(), path)}:${line + 1} has hard-coded landing-page prop "${node.name.getText(sourceFile)}"`
          )
        }
      }

      if (
        ts.isPropertyAssignment(node) &&
        !['title', 'subtitle', 'description', 'question', 'answer', 'position', 'desc', 'feature', 'label'].includes(
          node.name.getText(sourceFile).replace(/[\"']/g, '')
        )
      ) {
        const value = node.initializer
        const propertyName = node.name.getText(sourceFile).replace(/[\"']/g, '')

        if (
          (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) &&
          isUiText(value.text) &&
          !technicalPropertyNames.has(propertyName) &&
          !commonKeys.has(value.text)
        ) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))

          errors.push(
            `${relative(process.cwd(), path)}:${line + 1} has hard-coded landing-page data "${propertyName}": “${normalize(value.text)}”`
          )
        }
      }

      ts.forEachChild(node, walk)
    }

    walk(sourceFile)
  }

  for (const relativePath of dataFiles) {
    const path = resolve(process.cwd(), relativePath)
    const sourceText = readFileSync(path, 'utf8')
    const sourceFile = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

    const walkData = (node: ts.Node) => {
      if (ts.isPropertyAssignment(node) && ['title', 'subtitle'].includes(node.name.getText(sourceFile))) {
        const value = node.initializer

        if (ts.isStringLiteral(value) && isUiText(value.text) && !commonKeys.has(value.text)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(value.getStart(sourceFile))

          errors.push(
            `${relative(process.cwd(), path)}:${line + 1} data copy must reference a common dictionary key: “${value.text}”`
          )
        }
      }

      if (
        ts.isPropertyAssignment(node) &&
        node.name.getText(sourceFile) === 'planBenefits' &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        for (const element of node.initializer.elements) {
          if (ts.isStringLiteral(element) && !commonKeys.has(element.text)) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(element.getStart(sourceFile))

            errors.push(
              `${relative(process.cwd(), path)}:${line + 1} data copy must reference a common dictionary key: “${element.text}”`
            )
          }
        }
      }

      ts.forEachChild(node, walkData)
    }

    walkData(sourceFile)
  }

  if (errors.length > 0) {
    console.error('Landing-page content and pricing UI must use the translation system:')
    console.error(errors.join('\n'))
    process.exit(1)
  }
}

const changedFiles = () => {
  if (process.argv.includes('--all')) {
    const collectSourceFiles = (directory: string): string[] =>
      readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = resolve(directory, entry.name)

        if (entry.isDirectory()) return collectSourceFiles(path)

        return sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')))
          ? [relative(process.cwd(), path)]
          : []
      })

    return collectSourceFiles(resolve(process.cwd(), 'src'))
  }

  const explicitFiles = process.argv.slice(2).filter(argument => !argument.startsWith('--'))

  if (explicitFiles.length > 0) {
    return explicitFiles
      .map(file => file.replace(/\\/g, '/'))
      .map(file => (file.startsWith('apps/web/') ? file.slice('apps/web/'.length) : file))
  }

  try {
    const prefix = execFileSync('git', ['rev-parse', '--show-prefix'], { encoding: 'utf8' }).trim()

    const baseRef = process.env.I18N_BASE_REF

    const committedChanges = baseRef
      ? execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...HEAD`], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore']
        })
      : ''

    const workingChanges = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })

    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
      encoding: 'utf8'
    })

    return [
      ...new Set(
        [...committedChanges.split(/\r?\n/), ...workingChanges.split(/\r?\n/), ...untracked.split(/\r?\n/)]
          .map(file => file.trim())
          .filter(Boolean)
      )
    ]
      .map(file => (prefix && file.startsWith(prefix) ? file.slice(prefix.length) : file))
      .filter(file => file && !file.startsWith('apps/web/'))
  } catch {
    console.error('i18n gate needs Git metadata. Run it inside a Git checkout or pass source files explicitly.')
    process.exit(2)
  }
}

const violations: string[] = []

validateRequiredLocaleKeys()
validateProfileFixtureKeys()
validateFrontLayoutLiterals()
validateFrontLandingLiterals()

for (const relativePath of changedFiles()) {
  if (!sourceExtensions.has(relativePath.slice(relativePath.lastIndexOf('.')))) continue

  const path = resolve(process.cwd(), relativePath)
  let sourceText: string

  try {
    sourceText = readFileSync(path, 'utf8')
  } catch {
    continue
  }

  const sourceFile = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  const report = (node: ts.Node, value: string, description: string) => {
    const text = normalize(value)
      .replace(/&(?:#\d+|#x[\da-fA-F]+|[A-Za-z]+);/g, '')
      .trim()

    if (!text || !isUiText(text)) return

    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))

    violations.push(`${relative(process.cwd(), path)}:${line + 1} ${description}: “${text}”`)
  }

  const reportRenderedExpression = (node: ts.Expression, description = 'literal JSX expression') => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      report(node, node.text, description)

      return
    }

    if (ts.isTemplateExpression(node)) {
      const text = [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(' ')

      report(node, text, description)

      return
    }

    if (ts.isConditionalExpression(node)) {
      reportRenderedExpression(node.whenTrue, description)
      reportRenderedExpression(node.whenFalse, description)
    } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      reportRenderedExpression(node.left, description)
      reportRenderedExpression(node.right, description)
    } else if (ts.isArrayLiteralExpression(node)) {
      node.elements.forEach(element => {
        if (ts.isExpression(element)) reportRenderedExpression(element, description)
      })
    } else if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    ) {
      reportRenderedExpression(node.expression, description)
    }
  }

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) report(node, node.text, 'literal JSX text')

    if (ts.isJsxExpression(node) && node.expression) {
      if (ts.isJsxAttribute(node.parent)) {
        const attributeName = node.parent.name.getText(sourceFile)

        if (!ignoredAttributes.has(attributeName)) reportRenderedExpression(node.expression)
      } else {
        const expression = node.expression

        if (
          ts.isBinaryExpression(expression) &&
          expression.operatorToken.kind === ts.SyntaxKind.PlusToken &&
          ts.isPropertyAccessExpression(expression.left) &&
          expression.left.expression.getText(sourceFile) === 'data' &&
          expression.left.name.text === 'id'
        ) {
          // Dynamic accessibility IDs are technical values rather than user-facing copy.
        } else {
          reportRenderedExpression(expression)
        }
      }
    }

    if (ts.isCallExpression(node)) {
      const callee = node.expression

      const calleeName = ts.isIdentifier(callee)
        ? callee.text
        : ts.isPropertyAccessExpression(callee)
          ? callee.name.text
          : ''

      const isToastMessage =
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === 'toast'

      const firstArgument = node.arguments[0]

      if (
        (uiMessageCalls.has(calleeName) || isToastMessage) &&
        firstArgument &&
        (ts.isStringLiteral(firstArgument) || ts.isNoSubstitutionTemplateLiteral(firstArgument))
      ) {
        report(firstArgument, firstArgument.text, 'literal user message')
      }

      if (validationMessageCalls.has(calleeName)) {
        const messageArgument = calleeName === 'minLength' || calleeName === 'maxLength' ? 1 : 0
        const message = node.arguments[messageArgument]

        if (message && (ts.isStringLiteral(message) || ts.isNoSubstitutionTemplateLiteral(message))) {
          report(message, message.text, 'literal validation message')
        }
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const propertyName = node.name.getText(sourceFile).replace(/['"]/g, '')

      if (propertyName === 'title' || propertyName === 'description') {
        let ancestor: ts.Node | undefined = node
        let isMetadata = false

        while (ancestor && !ts.isSourceFile(ancestor)) {
          if (
            ts.isVariableDeclaration(ancestor) &&
            (ancestor.name.getText(sourceFile) === 'metadata' ||
              ancestor.name.getText(sourceFile) === 'generateMetadata')
          ) {
            isMetadata = true
            break
          }

          ancestor = ancestor.parent
        }

        if (isMetadata) {
          reportRenderedExpression(node.initializer, 'literal page metadata')
        }
      }

      if (uiDataProperties.has(propertyName) && !propertyName.startsWith('aria-')) {
        let ancestor: ts.Node | undefined = node.parent
        let isJsxProp = false

        while (ancestor && !ts.isSourceFile(ancestor)) {
          if (ts.isJsxExpression(ancestor)) {
            isJsxProp = true
            break
          }

          ancestor = ancestor.parent
        }

        if (!isJsxProp) {
          const literalKey =
            ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer)
              ? node.initializer.text
              : null

          if (literalKey === null || !/^[A-Za-z][A-Za-z0-9]*$/.test(literalKey)) {
            reportRenderedExpression(node.initializer, `literal UI data "${propertyName}"`)
          }
        }
      }
    }

    if (ts.isJsxAttribute(node) && node.initializer && !ignoredAttributes.has(node.name.getText(sourceFile))) {
      const initializer = node.initializer
      const attributeName = node.name.getText(sourceFile)

      const value =
        ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)
          ? initializer.text
          : ts.isJsxExpression(initializer) &&
              initializer.expression &&
              (ts.isStringLiteral(initializer.expression) || ts.isNoSubstitutionTemplateLiteral(initializer.expression))
            ? initializer.expression.text
            : null

      const isTechnicalOptionValue = attributeName === 'defaultValue' && /^[a-z0-9][a-z0-9_-]*$/.test(value ?? '')

      if (value !== null && !isTechnicalOptionValue) report(initializer, value, `literal UI prop "${attributeName}"`)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

if (violations.length > 0) {
  console.error(
    'Found hard-coded user-facing UI text. Add a dictionary key and render it through the translation system:'
  )

  if (process.argv.includes('--all')) {
    const fileCounts = new Map<string, number>()

    for (const violation of violations) {
      const file = violation.slice(0, violation.indexOf(':'))

      fileCounts.set(file, (fileCounts.get(file) ?? 0) + 1)
    }

    console.error(`Global audit found ${violations.length} violations in ${fileCounts.size} files.`)
    console.error(
      [...fileCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 40)
        .map(([file, count]) => `${file}: ${count} violations`)
        .join('\n')
    )
    console.error('First 60 findings:')
    console.error(violations.slice(0, 60).join('\n'))
  } else {
    console.error(violations.join('\n'))
  }

  process.exit(1)
}

console.log('i18n gate passed for changed TSX/JSX files.')
