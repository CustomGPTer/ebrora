#!/bin/bash
# =============================================================================
# Ebrora SEO Fixes — Run from repo root in Codespaces
# Applies all 13 SEO fixes in one go. Safe to re-run.
# =============================================================================
set -e

echo "🔍 Checking we're in the right directory..."
if [ ! -f "src/app/page.tsx" ] || [ ! -f "src/app/layout.tsx" ]; then
  echo "❌ Run this from the repo root (where src/ lives)"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Ebrora SEO Patch — 13 fixes, 45 files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Python does the heavy lifting (safe string replacement) ───
python3 << 'PYEOF'
import os, re, glob, json

fixes = 0
errors = []

def replace_in_file(path, old, new, label=""):
    global fixes
    with open(path) as f:
        content = f.read()
    if old not in content:
        return False
    content = content.replace(old, new, 1)
    with open(path, 'w') as f:
        f.write(content)
    fixes += 1
    if label:
        print(f"  ✅ {label}")
    return True

def replace_all_in_file(path, old, new):
    with open(path) as f:
        content = f.read()
    if old not in content:
        return False
    content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)
    return True

# ═══════════════════════════════════════════════════════════════
# FIX #1: Homepage meta — "8 AI" → "35+", "55+" → "750+"
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #1: Homepage metadata counts...")
p = "src/app/page.tsx"
replace_all_in_file(p, "8 AI document generators", "35+ AI document generators")
replace_all_in_file(p, "55+ Excel templates", "750+ professional Excel templates")
replace_all_in_file(p, "55+ Excel templates", "750+ downloadable templates")
# Also fix the homepage schema
replace_all_in_file(p, "8 AI document generators including RAMS, COSHH, ITP, DSE and more — plus premium Excel templates", 
                       "35+ AI document generators including RAMS, COSHH, RIDDOR, Working at Height and more — plus 750+ professional Excel templates")
# Fix OG title
replace_all_in_file(p, "Ebrora | AI-Powered Construction Document Generators'",
                       "Ebrora | AI-Powered Construction Document Generators & Excel Templates'")
print("  ✅ Homepage meta updated")

# ═══════════════════════════════════════════════════════════════
# FIX #2: Layout default title + description
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #2: Layout default title & description...")
p = "src/app/layout.tsx"
replace_in_file(p,
    "default: 'Construction Excel Templates for UK Sites | Ebrora'",
    "default: 'AI Construction Document Generators & Excel Templates | Ebrora'",
    "Default title")
replace_in_file(p,
    "'Download professional Excel templates for UK construction and civil engineering. CDM 2015 compliant, instant download, no signup required.'",
    "'AI-powered document generators and professional Excel templates for UK construction. 35+ AI tools, RAMS Builder, 750+ templates, 1,500+ free toolbox talks. Built by site teams, for site teams.'",
    "Default description")
# OG title+desc
replace_all_in_file(p, "title: 'Construction Excel Templates for UK Sites | Ebrora'",
                       "title: 'AI Construction Document Generators & Excel Templates | Ebrora'")
replace_all_in_file(p,
    "'Professional Excel templates for UK construction and civil engineering. CDM 2015 compliant. Instant download, no signup required.'",
    "'AI-powered document generators and professional Excel templates for UK construction. 35+ AI tools, RAMS Builder, 750+ templates, 1,500+ toolbox talks.'")

# ═══════════════════════════════════════════════════════════════
# FIX #3: Organization + WebSite schema
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #3: Organization & WebSite schemas...")
replace_in_file(p,
    "'Professional Excel templates built specifically for UK construction and civil engineering professionals. CDM 2015 compliant tools for site managers, engineers, and project teams.'",
    "'AI-powered construction document generators and professional Excel templates for UK site teams. 35+ AI tools including RAMS Builder, COSHH, RIDDOR, and Working at Height — plus 750+ downloadable templates and 1,500+ free toolbox talks.'",
    "Organization schema")
replace_in_file(p,
    "'Professional Excel templates for UK construction and civil engineering. Instant download, no signup required.'",
    "'AI-powered construction document generators, professional Excel templates, and 1,500+ free toolbox talks for UK construction professionals.'",
    "WebSite schema")

# ═══════════════════════════════════════════════════════════════
# FIX #8: Stale counts in nav + homepage
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #8: Stale counts...")
replace_in_file("src/components/navigation/ProductsDropdown.tsx",
    '"25+ tools', '"35+ tools', "ProductsDropdown 25→35")
replace_in_file("src/components/navigation/ResourcesDropdown.tsx",
    "across 27 categories", "across 60 categories", "ResourcesDropdown 27→60")

hp = "src/components/home/HomepageClient.tsx"
replace_in_file(hp, "stat: '55+'", "stat: '750+'", "HomepageClient stat 55→750")

# ═══════════════════════════════════════════════════════════════
# FIX #12: Homepage H1
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #12: Homepage H1...")
replace_in_file(hp,
    "The Most Powerful AI Construction Tools Available\n          </h1>",
    "AI-Powered RAMS, Risk Assessments &amp; Construction Documents for UK Sites\n          </h1>",
    "Hero H1")
replace_in_file(hp,
    "25+ AI document generators, 1,500+ free toolbox talks, 1,000+ downloadable",
    "35+ AI document generators, 1,500+ free toolbox talks, 750+ downloadable",
    "Hero subtitle counts")
replace_all_in_file(hp,
    "The Most Powerful AI Construction Tools Available</h2>",
    "AI-Powered RAMS, Risk Assessments &amp; Construction Documents</h2>")

# ═══════════════════════════════════════════════════════════════
# FIX #4 + #13: Footer — add Products/Resources columns + desc
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #4 + #13: Footer...")
fp = "src/components/Footer.tsx"
replace_in_file(fp,
    'grid grid-cols-3 gap-4 sm:gap-6 lg:gap-12',
    'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 lg:gap-10',
    "Footer grid")
# Brand column span
replace_in_file(fp, '{/* Brand Column */}\n          <div>', 
    '{/* Brand Column */}\n          <div className="col-span-2 md:col-span-4 lg:col-span-1">',
    "Brand col-span")
# Description
replace_in_file(fp,
    "Professional Excel templates built specifically for construction and civil engineering professionals.",
    "AI-powered document generators and professional Excel templates built for UK construction and civil engineering teams.",
    "Footer description")
# Replace Company+Legal columns with Products+Resources+Company+Legal
replace_in_file(fp,
    """          {/* Company Column */}
          <div>
            <h4 className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Company</h4>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <a href="/#about" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">About</a>
              <a href="/#contact" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Contact Us</a>
              <a href="mailto:hello@ebrora.com" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Email Support</a>
              <Link href="/faq" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Legal</h4>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <Link href="/faq" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Help Centre</Link>
              <Link href="/refund-policy" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Refund Policy</Link>
              <Link href="/terms-of-service" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy-policy" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>""",
    """          {/* Products Column */}
          <div>
            <h4 className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Products</h4>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <Link href="/rams-builder" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">RAMS Builder</Link>
              <Link href="/products" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">AI Tools</Link>
              <Link href="/products" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Excel Templates</Link>
              <Link href="/pricing" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
            </div>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Resources</h4>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <Link href="/free-templates" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Free Templates</Link>
              <Link href="/toolbox-talks" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Toolbox Talks</Link>
              <Link href="/blog" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Blog</Link>
              <Link href="/tools" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Free Tools</Link>
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Company</h4>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <a href="/#about" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">About</a>
              <a href="/#contact" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Contact Us</a>
              <a href="mailto:hello@ebrora.com" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Email Support</a>
              <Link href="/faq" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Legal</h4>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <Link href="/refund-policy" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Refund Policy</Link>
              <Link href="/terms-of-service" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy-policy" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>""",
    "Footer columns")

# ═══════════════════════════════════════════════════════════════
# FIX #5 + #7: Builder pages — JSON-LD + Breadcrumbs
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #5 + #7: Builder JSON-LD + breadcrumbs (36 pages)...")

CATEGORY_MAP = {
    'coshh-builder': ('Health & Safety', 'COSHH Assessment'),
    'manual-handling-builder': ('Health & Safety', 'Manual Handling Assessment'),
    'dse-builder': ('Health & Safety', 'DSE Assessment'),
    'tbt-builder': ('Health & Safety', 'Toolbox Talk Generator'),
    'confined-spaces-builder': ('Health & Safety', 'Confined Space Assessment'),
    'incident-report-builder': ('Health & Safety', 'Incident Report Generator'),
    'lift-plan-builder': ('Health & Safety', 'Lift Plan Generator'),
    'emergency-response-builder': ('Health & Safety', 'Emergency Response Plan'),
    'permit-to-dig-builder': ('Health & Safety', 'Permit to Dig Generator'),
    'powra-builder': ('Health & Safety', 'POWRA Generator'),
    'cdm-checker-builder': ('Health & Safety', 'CDM Compliance Checker'),
    'noise-assessment-builder': ('Health & Safety', 'Noise Assessment Generator'),
    'safety-alert-builder': ('Health & Safety', 'Safety Alert Generator'),
    'rams-review-builder': ('Health & Safety', 'RAMS Review Tool'),
    'wah-assessment-builder': ('Health & Safety', 'Working at Height Assessment'),
    'wbv-assessment-builder': ('Health & Safety', 'WBV Assessment'),
    'riddor-report-builder': ('Health & Safety', 'RIDDOR Report Builder'),
    'traffic-management-builder': ('Health & Safety', 'Traffic Management Plan'),
    'waste-management-builder': ('Health & Safety', 'Waste Management Plan'),
    'invasive-species-builder': ('Health & Safety', 'Invasive Species Management'),
    'itp-builder': ('Quality', 'ITP Builder'),
    'quality-checklist-builder': ('Quality', 'Quality Inspection Checklist'),
    'ncr-builder': ('Quality', 'NCR Generator'),
    'scope-of-works-builder': ('Commercial', 'Scope of Works Builder'),
    'early-warning-builder': ('Commercial', 'Early Warning Notice Builder'),
    'ce-notification-builder': ('Commercial', 'CE Notification Builder'),
    'quote-generator-builder': ('Commercial', 'Quotation Generator'),
    'delay-notification-builder': ('Commercial', 'Delay Notification Builder'),
    'variation-confirmation-builder': ('Commercial', 'Variation Confirmation'),
    'rfi-generator-builder': ('Commercial', 'RFI Builder'),
    'payment-application-builder': ('Commercial', 'Payment Application Generator'),
    'daywork-sheet-builder': ('Commercial', 'Daywork Sheet Generator'),
    'programme-checker-builder': ('Programme', 'Construction Programme Checker'),
    'carbon-footprint-builder': ('Programme', 'Carbon Footprint Generator'),
    'carbon-reduction-plan-builder': ('Programme', 'Carbon Reduction Plan'),
    'rams-builder': ('RAMS', 'RAMS Builder'),
}

HAS_JSONLD = {
    'coshh-builder', 'confined-spaces-builder', 'dse-builder', 'itp-builder',
    'cdm-checker-builder', 'quote-generator-builder', 'rams-builder',
    'scope-of-works-builder', 'tbt-builder'
}

builder_count = 0
for dirname in sorted(glob.glob("src/app/*-builder")):
    bname = os.path.basename(dirname)
    page_path = os.path.join(dirname, "page.tsx")
    if not os.path.exists(page_path):
        continue
    
    with open(page_path) as f:
        content = f.read()
    
    if 'BreadcrumbNav' in content:
        # Already patched (re-run safe)
        builder_count += 1
        continue
    
    category, label = CATEGORY_MAP.get(bname, ('Tools', bname.replace('-builder', '').replace('-', ' ').title()))
    has_jsonld = bname in HAS_JSONLD
    
    # Add BreadcrumbNav import
    import_lines = list(re.finditer(r'^import .+;\n', content, re.MULTILINE))
    if import_lines:
        pos = import_lines[-1].end()
        content = content[:pos] + "import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';\n" + content[pos:]
    
    bc_items = f'[{{ label: "AI Tools", href: "/" }}, {{ label: "{category}" }}, {{ label: "{label}" }}]'
    
    # Add JSON-LD for pages that don't have it
    if not has_jsonld:
        title_m = re.search(r"absolute:\s*['\"](.+?)['\"]", content)
        desc_m = re.search(r"description:\s*['\"](.+?)['\"]", content)
        schema_name = f"Ebrora {title_m.group(1).split('|')[0].strip()}" if title_m else f"Ebrora {label}"
        schema_desc = desc_m.group(1)[:300] if desc_m else f"AI-powered {label.lower()} for UK construction."
        
        schema_block = f"""
const toolSchema = {{
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: {json.dumps(schema_name)},
  applicationCategory: 'BusinessApplication',
  description: {json.dumps(schema_desc)},
  url: 'https://www.ebrora.com/{bname}',
  operatingSystem: 'Web',
  offers: {{ '@type': 'Offer', price: '0', priceCurrency: 'GBP' }},
  publisher: {{ '@type': 'Organization', name: 'Ebrora', url: 'https://www.ebrora.com' }},
}};
"""
        content = re.sub(r'(export default function)', schema_block + r'\1', content, count=1)
    
    # Wrap return with JSON-LD script + breadcrumbs
    # Match: return <ComponentName ... />; (with or without props)
    m = re.search(r'return\s+(<\w+[^>]*/>)\s*;', content)
    if m:
        client_tag = m.group(1)
        jsonld_script = """<script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      """ if not has_jsonld else ""
        # For pages with existing JSON-LD, we need to find the existing script+component pattern
        if has_jsonld:
            # These already have <><script.../><Component /></>
            # Insert breadcrumb between script and component
            pattern = r'(/>\s*\n)([ \t]+)(<[A-Z]\w+)'
            matches = list(re.finditer(pattern, content))
            if matches:
                m2 = matches[-1]
                bc_block = f'{m2.group(2)}<div className="max-w-[1200px] mx-auto px-6 pt-4">\n{m2.group(2)}  <BreadcrumbNav items={{{bc_items}}} />\n{m2.group(2)}</div>\n'
                content = content[:m2.end(1)] + bc_block + m2.group(2) + m2.group(3) + content[m2.end():]
        else:
            new_return = f"""return (
    <>
      {jsonld_script}<div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={{{bc_items}}} />
      </div>
      {client_tag}
    </>
  );"""
            content = content[:m.start()] + new_return + content[m.end():]
    elif has_jsonld:
        # Fragment wrapper already exists — just insert breadcrumb
        pattern = r'(/>\s*\n)([ \t]+)(<[A-Z]\w+)'
        matches = list(re.finditer(pattern, content))
        if matches:
            m2 = matches[-1]
            bc_block = f'{m2.group(2)}<div className="max-w-[1200px] mx-auto px-6 pt-4">\n{m2.group(2)}  <BreadcrumbNav items={{{bc_items}}} />\n{m2.group(2)}</div>\n'
            content = content[:m2.end(1)] + bc_block + m2.group(2) + m2.group(3) + content[m2.end():]
    
    with open(page_path, 'w') as f:
        f.write(content)
    builder_count += 1
    print(f"  ✅ {bname}")

print(f"  → {builder_count} builder pages processed")

# ═══════════════════════════════════════════════════════════════
# FIX #9: Blog listing — CollectionPage schema
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #9: Blog listing schema...")
bp = "src/app/blog/page.tsx"
with open(bp) as f:
    bc = f.read()
if 'blogSchema' not in bc:
    bc = bc.replace(
        "export default function BlogPage() {\n    return <BlogListingClient posts={POSTS} categories={BLOG_CATEGORIES} />;",
        """const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Ebrora Blog — Construction Safety & RAMS Guides',
  description: 'Expert guides on construction safety, RAMS templates, risk assessments and method statements.',
  url: 'https://www.ebrora.com/blog',
  publisher: { '@type': 'Organization', name: 'Ebrora', url: 'https://www.ebrora.com' },
};

export default function BlogPage() {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
        <BlogListingClient posts={POSTS} categories={BLOG_CATEGORIES} />
      </>
    );""")
    with open(bp, 'w') as f:
        f.write(bc)
    print("  ✅ Blog CollectionPage schema added")
else:
    print("  ⏭️  Already has schema")

# ═══════════════════════════════════════════════════════════════
# FIX #11: Products listing — CollectionPage schema
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #11: Products listing schema...")
pp = "src/app/products/page.tsx"
with open(pp) as f:
    pc = f.read()
if 'productsSchema' not in pc:
    pc = pc.replace(
        "export default function ProductsPage() {\n  return (\n    <SearchProvider>",
        """const productsSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Premium Construction Excel Templates',
  description: 'Browse our full range of professional Excel templates for UK construction and civil engineering.',
  url: 'https://www.ebrora.com/products',
  numberOfItems: PRODUCTS.length,
  publisher: { '@type': 'Organization', name: 'Ebrora', url: 'https://www.ebrora.com' },
};

export default function ProductsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productsSchema) }} />
      <SearchProvider>""")
    # Close the fragment
    pc = pc.replace(
        "    </SearchProvider>\n  );\n}",
        "    </SearchProvider>\n    </>\n  );\n}")
    with open(pp, 'w') as f:
        f.write(pc)
    print("  ✅ Products CollectionPage schema added")
else:
    print("  ⏭️  Already has schema")

# ═══════════════════════════════════════════════════════════════
# FIX #14: Unsubscribe — multiple H1s
# ═══════════════════════════════════════════════════════════════
print("\n📝 Fix #14: Unsubscribe H1s...")
up = "src/app/unsubscribe/page.tsx"
with open(up) as f:
    uc = f.read()
changed = False
if '<h1 className="page-header">Unsubscribed</h1>' in uc:
    uc = uc.replace('<h1 className="page-header">Unsubscribed</h1>', '<h2 className="page-header">Unsubscribed</h2>')
    changed = True
if '<h1 className="page-header">Loading...</h1>' in uc:
    uc = uc.replace('<h1 className="page-header">Loading...</h1>', '<h2 className="page-header">Loading...</h2>')
    changed = True
if changed:
    with open(up, 'w') as f:
        f.write(uc)
    print("  ✅ Reduced to single H1")
else:
    print("  ⏭️  Already fixed")

print(f"\n✨ Done — {fixes} replacements applied")
PYEOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All SEO fixes applied!"
echo "  Run: git diff --stat"
echo "  Then: git add -A && git commit -m 'SEO: 13 fixes — meta, schema, footer, breadcrumbs'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Extra: Fix breadcrumb links (if they point to /products) ───
python3 << 'PYEOF2'
import glob, os

fixed = 0
for f in sorted(glob.glob("src/app/*-builder/page.tsx")):
    with open(f) as fh:
        c = fh.read()
    orig = c
    c = c.replace('{ label: "AI Tools", href: "/products" }', '{ label: "AI Tools", href: "/" }')
    c = c.replace('{ label: "Health & Safety", href: "/products" }', '{ label: "Health & Safety" }')
    c = c.replace('{ label: "Quality", href: "/products" }', '{ label: "Quality" }')
    c = c.replace('{ label: "Commercial", href: "/products" }', '{ label: "Commercial" }')
    c = c.replace('{ label: "Programme", href: "/products" }', '{ label: "Programme" }')
    c = c.replace('{ label: "RAMS", href: "/products" }', '{ label: "RAMS" }')
    if c != orig:
        with open(f, 'w') as fh:
            fh.write(c)
        fixed += 1
if fixed:
    print(f"  ✅ Fixed breadcrumb links on {fixed} pages")
else:
    print("  ⏭️  Breadcrumb links already correct")
PYEOF2
