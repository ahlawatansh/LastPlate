import os
import sys
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image as RLImage
)
from reportlab.pdfgen import canvas

PAGE_WIDTH, PAGE_HEIGHT = A4

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and draw 'Page X of Y' and running headers."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress headers/footers on cover page

        self.saveState()
        self.setFont("Times-Roman", 9)
        self.setFillColor(colors.HexColor("#4A5568"))

        # Running Header
        header_text = "BCSE301P: Software Engineering Laboratory | Assessment-9 UI Design Report"
        self.drawString(54, PAGE_HEIGHT - 38, header_text)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, PAGE_HEIGHT - 42, PAGE_WIDTH - 54, PAGE_HEIGHT - 42)

        # Running Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(PAGE_WIDTH - 54, 34, page_str)
        self.drawString(54, 34, "LastPlate – Dynamic Surplus Food Rescue Platform")
        self.line(54, 46, PAGE_WIDTH - 54, 46)

        self.restoreState()


def get_fitted_image(img_path, target_width=470, max_height=250):
    """Calculates proportional aspect ratio for ReportLab image embedding."""
    if not os.path.exists(img_path):
        return None
    try:
        with Image.open(img_path) as im:
            w, h = im.size
            aspect = h / float(w)
            target_height = target_width * aspect
            if target_height > max_height:
                target_height = max_height
                target_width = target_height / aspect
            return RLImage(img_path, width=target_width, height=target_height)
    except Exception as e:
        print(f"Error loading image {img_path}: {e}")
        return None


def create_ui_report_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Academic Typography Styles matching the VIT report format
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=28,
        leading=32,
        alignment=1,
        textColor=colors.HexColor("#0F172A")
    )

    cover_subtitle = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=13,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#334155")
    )

    cover_track = ParagraphStyle(
        'CoverTrack',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=11,
        leading=15,
        alignment=1,
        textColor=colors.HexColor("#0F2942")
    )

    cover_report_type = ParagraphStyle(
        'CoverReportType',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=13,
        leading=17,
        alignment=1,
        textColor=colors.HexColor("#1E293B")
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Times-Bold',
        fontSize=15.5,
        leading=19,
        spaceBefore=14,
        spaceAfter=7,
        textColor=colors.HexColor("#0F172A"),
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Times-Bold',
        fontSize=12,
        leading=15.5,
        spaceBefore=10,
        spaceAfter=4,
        textColor=colors.HexColor("#1E293B"),
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9.8,
        leading=14.2,
        spaceAfter=6,
        textColor=colors.HexColor("#1E293B")
    )

    body_bold = ParagraphStyle(
        'Body_Bold',
        parent=body_style,
        fontName='Times-Bold'
    )

    caption_style = ParagraphStyle(
        'FigCaption',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=8.8,
        leading=12,
        alignment=1,
        spaceBefore=4,
        spaceAfter=8,
        textColor=colors.HexColor("#334155")
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#1E293B")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Times-Bold'
    )

    story = []

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 15))
    story.append(Paragraph("VIT", ParagraphStyle('VitTop', fontName='Times-Bold', fontSize=20, leading=24, alignment=1, textColor=colors.HexColor("#002147"))))
    story.append(Paragraph("Vellore Institute of Technology", ParagraphStyle('VitUniv', fontName='Times-Bold', fontSize=12, leading=15, alignment=1, textColor=colors.HexColor("#002147"))))
    story.append(Paragraph("(Deemed to be University under section 3 of UGC Act, 1956)", ParagraphStyle('VitSub', fontName='Times-Roman', fontSize=10, leading=13, alignment=1, textColor=colors.HexColor("#334155"))))
    story.append(Spacer(1, 10))
    story.append(Paragraph("School of Computer Science Engineering and Information Systems", ParagraphStyle('VitSchool', fontName='Times-Bold', fontSize=11, leading=14, alignment=1, textColor=colors.HexColor("#1E293B"))))
    story.append(Paragraph("Fall Semester 2026–2027", ParagraphStyle('VitSem', fontName='Times-Roman', fontSize=10, leading=13, alignment=1, textColor=colors.HexColor("#334155"))))
    story.append(Spacer(1, 16))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=2, spaceAfter=2))
    story.append(HRFlowable(width="100%", thickness=2.5, color=colors.HexColor("#0F172A"), spaceBefore=0, spaceAfter=14))

    story.append(Paragraph("SOFTWARE ENGINEERING LABORATORY", cover_track))
    story.append(Spacer(1, 10))
    story.append(Paragraph("LastPlate", title_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Dynamic Food Delivery & Real-Time Surplus Food Rescue Platform", cover_subtitle))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Assessment 9: User Interface Design and Human-Computer Interaction Report", cover_report_type))
    story.append(Spacer(1, 14))

    story.append(HRFlowable(width="100%", thickness=2.5, color=colors.HexColor("#0F172A"), spaceBefore=0, spaceAfter=2))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=0, spaceAfter=14))

    story.append(Paragraph("Course: Software Engineering (BCSE301P) | Assessment-9 [10 Marks]", ParagraphStyle('CourseSub', fontName='Times-Bold', fontSize=10.5, leading=14, alignment=1, textColor=colors.HexColor("#0F2942"))))
    story.append(Spacer(1, 14))

    student_data = [
        [Paragraph("<b>Name</b>", table_header), Paragraph("<b>Registration No</b>", table_header)],
        [Paragraph("Ansh Ahlawat", table_cell_bold), Paragraph("24BDE0019", table_cell_bold)],
    ]
    t_student = Table(student_data, colWidths=[240, 247])
    t_student.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_student)
    story.append(Spacer(1, 6))
    story.append(Paragraph("Solo Full-Stack Architect & User Interface Designer", ParagraphStyle('RoleSub', fontName='Times-Italic', fontSize=9.5, leading=13, alignment=1, textColor=colors.HexColor("#475569"))))
    story.append(Spacer(1, 14))

    proj_data = [
        [Paragraph("<b>GitHub repository</b>", table_cell_bold), Paragraph("github.com/ahlawatansh/LastPlate", table_cell)],
        [Paragraph("<b>Live web application (Vercel)</b>", table_cell_bold), Paragraph("lastplate.vercel.app", table_cell)],
        [Paragraph("<b>Module Evaluated</b>", table_cell_bold), Paragraph("Multi-Role Responsive UI & Dynamic Surplus Interaction Design", table_cell)],
        [Paragraph("<b>UI/UX Design Frameworks</b>", table_cell_bold), Paragraph("React 19, Tailwind CSS v4, Motion, Lucide Icons, Mobile-First Ergonomics", table_cell)],
    ]
    t_proj = Table(proj_data, colWidths=[180, 307])
    t_proj.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#F8FAFC")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_proj)
    story.append(Spacer(1, 24))

    story.append(Paragraph("Under the Guidance of", ParagraphStyle('UnderG', fontName='Times-Italic', fontSize=10, leading=13, alignment=1, textColor=colors.HexColor("#475569"))))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Course Instructor & Faculty in Charge</b>", ParagraphStyle('FacName', fontName='Times-Bold', fontSize=12, leading=15, alignment=1, textColor=colors.HexColor("#0F172A"))))
    story.append(Paragraph("Department of Software and Systems Engineering", ParagraphStyle('Dept', fontName='Times-Roman', fontSize=10, leading=13, alignment=1, textColor=colors.HexColor("#334155"))))
    story.append(Paragraph("School of Computer Science Engineering and Information Systems", ParagraphStyle('SchoolF', fontName='Times-Roman', fontSize=10, leading=13, alignment=1, textColor=colors.HexColor("#334155"))))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: ABSTRACT & PURPOSE/REQUIREMENTS
    # =========================================================================
    story.append(Paragraph("1 Abstract and Executive Summary", h1_style))
    story.append(Paragraph(
        "<b>LastPlate</b> is an enterprise-grade food delivery and real-time surplus rescue application engineered to solve commercial food wastage through dynamic clearance auctions. This report presents the comprehensive <b>User Interface (UI) and Human-Computer Interaction (HCI) Design</b> for the LastPlate multi-role platform, adhering strictly to established usability heuristics, cognitive ergonomics, and modern responsive design standards.",
        body_style
    ))
    story.append(Paragraph(
        "The interface spans four role-specific portals (Customer, Restaurant Partner, Delivery Fleet, and Platform Administrator) unified under a coherent design system powered by <b>React 19, Tailwind CSS v4, Motion physics, and Lucide vector iconography</b>. The interface addresses complex real-time operational flows—including dynamic decaying discount counters, sliding basket management, GPS order tracking, multi-rail checkout, and kitchen prep forecasting—while maintaining strict simplicity, visual hierarchy, consistency, and instantaneous tactile feedback.",
        body_style
    ))

    story.append(Paragraph("2 Module Selection, Purpose and Requirements", h1_style))
    story.append(Paragraph(
        "The selected module for this assessment is the <b>Multi-Role Responsive UI & Surplus Interaction Engine</b>. This core visual and interactive layer connects all platform stakeholders while handling sensitive temporal decisions near culinary closing hours.",
        body_style
    ))

    story.append(Paragraph("2.1 Module Purpose", h2_style))
    story.append(Paragraph(
        "Traditional food delivery interfaces are built purely for static menus and fail to convey urgency, scarcity, and decaying price dynamics. The LastPlate UI is purposefully designed to: (1) present declining dynamic surplus discounts transparently with countdown clocks, (2) eliminate checkout friction via smooth non-intrusive drawers and multi-rail payment forms, (3) provide live delivery feedback through deterministic progress steppers, and (4) visualize personal carbon abatement ledgers.",
        body_style
    ))

    story.append(Paragraph("2.2 User Personas & Target Roles", h2_style))
    personas_data = [
        [Paragraph("<b>Role Persona</b>", table_header), Paragraph("<b>Primary User Goals</b>", table_header), Paragraph("<b>Critical Interface Requirements</b>", table_header)],
        [Paragraph("Customer / Diner", table_cell_bold), Paragraph("Discover discounted meals, order quickly, track live delivery.", table_cell), Paragraph("Decay timers, 1-click cart bump, clear delivery address, multi-rail checkout.", table_cell)],
        [Paragraph("Kitchen Operator", table_cell_bold), Paragraph("Manage live orders, forecast prep volume, publish surplus.", table_cell), Paragraph("Kanban stages, AI schedule calendar, surplus price sliders, stock updates.", table_cell)],
        [Paragraph("Delivery Rider", table_cell_bold), Paragraph("Accept dispatch runs, navigate routes, confirm delivery.", table_cell), Paragraph("Large tactile Duty Mode button, trip cards, earnings summary, handover trigger.", table_cell)],
        [Paragraph("Platform Admin", table_cell_bold), Paragraph("Review partner KYC, inspect system telemetry, audit metrics.", table_cell), Paragraph("Tabular approvals queue, document viewers, single-click approve/reject actions.", table_cell)],
    ]
    t_pers = Table(personas_data, colWidths=[100, 185, 202])
    t_pers.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_pers)
    story.append(Spacer(1, 8))

    story.append(Paragraph("2.3 Functional & Non-Functional Requirements", h2_style))
    story.append(Paragraph(
        "<b>Functional Requirements:</b> Dynamic price countdown calculation every 5 seconds; atomic inventory increment/decrement with stock cap; payment rail toggling (UPI VPA, Card 16-digit, COD); role switching with session isolation; and animated notifications. <b>Non-Functional Requirements:</b> First Contentful Paint < 0.8s; mobile viewport touch target sizes >= 44x44 pt (WCAG 2.1 AAA); responsive breakpoint fluidity across 360px to 2560px displays; and 100% theme color consistency.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: HCI & CORE DESIGN PRINCIPLES
    # =========================================================================
    story.append(Paragraph("3 Human-Computer Interaction (HCI) Principles Followed", h1_style))
    story.append(Paragraph(
        "The LastPlate design framework is grounded in established Human-Computer Interaction (HCI) heuristics, cognitive psychology principles, and ISO 9241 ergonomics standards.",
        body_style
    ))

    hci_data = [
        [Paragraph("<b>HCI Principle</b>", table_header), Paragraph("<b>Theoretical Foundation</b>", table_header), Paragraph("<b>Implementation in LastPlate UI</b>", table_header)],
        [
            Paragraph("Simplicity & Focus", table_cell_bold),
            Paragraph("Hick's Law & Cognitive Load Theory", table_cell),
            Paragraph("Monochromatic backdrop (#FAF9F6) with high-contrast text eliminates visual clutter. Uncluttered card layouts highlight only dish name, price delta, and time left.", table_cell)
        ],
        [
            Paragraph("Consistency", table_cell_bold),
            Paragraph("Norman's Mental Models", table_cell),
            Paragraph("Identical rounded radius tokens (rounded-3xl, rounded-full), unified typography (serif headings + sans-serif body), and consistent black active action buttons across all 4 portals.", table_cell)
        ],
        [
            Paragraph("Usability & Speed", table_cell_bold),
            Paragraph("Fitts's Law", table_cell),
            Paragraph("Key action controls—such as the Floating Demo Account Bar and Sticky Basket Pill—are placed in thumb-reachable bottom zones with generous tap targets.", table_cell)
        ],
        [
            Paragraph("Instant Feedback", table_cell_bold),
            Paragraph("Direct Manipulation (Shneiderman)", table_cell),
            Paragraph("Adding items triggers subtle spring micro-bumps (Motion); payment transitions exhibit clear spinners and confirmation checks; countdown progress bars visually deplete.", table_cell)
        ],
        [
            Paragraph("Error Prevention", table_cell_bold),
            Paragraph("Defensive Design", table_cell),
            Paragraph("Zero-basket checkout buttons are disabled; card CVV inputs enforce 3-digit lengths; quantity selectors automatically lock at remaining stock bounds.", table_cell)
        ],
    ]
    t_hci = Table(hci_data, colWidths=[90, 160, 237])
    t_hci.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_hci)
    story.append(Spacer(1, 10))

    story.append(Paragraph("4 Information Architecture & Navigation Flow", h1_style))
    story.append(Paragraph(
        "LastPlate uses a hybrid top-header and persistent floating bottom-bar architecture. The top navigation bar displays role-filtered functional tabs, global search, and unread notification alerts, while the bottom floating pill accommodates instantaneous demo role-switching and session authentication.",
        body_style
    ))

    nav_data = [
        [Paragraph("<b>Portal Layer</b>", table_header), Paragraph("<b>Active Sub-Views / Tabs</b>", table_header), Paragraph("<b>Key Interaction Widgets</b>", table_header)],
        [Paragraph("Customer Portal", table_cell_bold), Paragraph("Menu & Order, Surplus Rescue, My Orders, Rescue Impact", table_cell), Paragraph("Veg filter toggle, Live auction cards, Slide-in Food Basket, Payment modal, Live GPS timeline tracker.", table_cell)],
        [Paragraph("Restaurant Console", table_cell_bold), Paragraph("Live Kitchen, Schedule & Accuracy, AI Forecast, Surplus Listings, Menu Editor", table_cell), Paragraph("Order state advancing buttons, Production calendar, 3-year seasonal ML multipliers, Item editor modals.", table_cell)],
        [Paragraph("Delivery Fleet", table_cell_bold), Paragraph("Active Trips, Available Pool, Earnings & Incentive History", table_cell), Paragraph("Large Duty Mode online/offline switch, Order claim buttons, Delivery handover and proof simulator.", table_cell)],
        [Paragraph("Admin Console", table_cell_bold), Paragraph("Approvals Queue, All Orders Ledger, 3-Yr ML Benchmarks", table_cell), Paragraph("Tabular partner verification queues, Document reviewers, Global system state reset actions.", table_cell)],
    ]
    t_nav = Table(nav_data, colWidths=[90, 160, 237])
    t_nav.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_nav)
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: DETAILED SCREEN DESIGNS (AUTH & ONBOARDING)
    # =========================================================================
    story.append(Paragraph("5 User Interface Screen Designs & Input/Output Mapping", h1_style))
    story.append(Paragraph(
        "This section documents the primary interface screens of the LastPlate ecosystem, pairing high-resolution production captures with functional input/output mapping specifications.",
        body_style
    ))

    story.append(Paragraph("5.1 Authentication & Role-Based Onboarding", h2_style))
    story.append(Paragraph(
        "The onboarding interface balances security and accessibility. Evaluators can access instant one-click demo profiles, while real users authenticate via Firebase Google OAuth or role-specific KYC registration forms.",
        body_style
    ))

    # Figure 1: Sign-In View
    img1 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.51.30 PM.png', target_width=470, max_height=210)
    if img1:
        story.append(img1)
        story.append(Paragraph("Figure 1. LastPlate Secure Sign-In Interface with Google OAuth and Demo Switcher.", caption_style))

    # Table of I/O for Auth
    auth_io = [
        [Paragraph("<b>Component</b>", table_header), Paragraph("<b>UI Element Type</b>", table_header), Paragraph("<b>Purpose & Behavioral Mapping</b>", table_header)],
        [Paragraph("Email / Password Form", table_cell_bold), Paragraph("Input text & password fields", table_cell), Paragraph("Validates user credentials against local accounts and Firebase Auth.", table_cell)],
        [Paragraph("Google Sign-In Button", table_cell_bold), Paragraph("Branded OAuth button", table_cell), Paragraph("Triggers secure popup/redirect OAuth flow; pre-fills verified credentials on first sign-up.", table_cell)],
        [Paragraph("Bottom Quick Bar", table_cell_bold), Paragraph("Floating rounded pill", table_cell), Paragraph("Allows evaluators to switch instantly between Customer, Restaurant, Delivery, and Admin personas.", table_cell)],
    ]
    t_aio = Table(auth_io, colWidths=[110, 130, 247])
    t_aio.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_aio)
    story.append(Spacer(1, 6))

    # Figure 2: Registration View
    img2 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.51.41 PM.png', target_width=470, max_height=200)
    if img2:
        story.append(img2)
        story.append(Paragraph("Figure 2. Role-Based Onboarding Gateway (Customer, Restaurant Partner, Delivery Fleet).", caption_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: CUSTOMER SURPLUS RESCUE & CHECKOUT
    # =========================================================================
    story.append(Paragraph("5.2 Customer Portal: Dynamic Surplus Rescue & Checkout", h1_style))
    story.append(Paragraph(
        "The Customer Portal is engineered to maximize conversion of near-expiry meals while maintaining clear pricing transparency and effortless checkout execution.",
        body_style
    ))

    # Figure 3: Surplus Deals
    img3 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.46.36 PM.png', target_width=470, max_height=210)
    if img3:
        story.append(img3)
        story.append(Paragraph("Figure 3. Customer Portal – Live Surplus Clearance Auctions with Real-Time Decaying Discounts.", caption_style))

    surplus_io = [
        [Paragraph("<b>Component</b>", table_header), Paragraph("<b>UI Element Type</b>", table_header), Paragraph("<b>Purpose & Behavioral Mapping</b>", table_header)],
        [Paragraph("Auction Deal Cards", table_cell_bold), Paragraph("Interactive card with badges", table_cell), Paragraph("Displays dish image, live decayed price, strikethrough original price, countdown timer, and quantity.", table_cell)],
        [Paragraph("Dynamic Price Badge", table_cell_bold), Paragraph("Decaying tag (Rs. 195 vs Rs. 380)", table_cell), Paragraph("Visualizes immediate savings; updates automatically as store closing hour nears.", table_cell)],
        [Paragraph("Rescue Meal Button", table_cell_bold), Paragraph("Black action button with + / -", table_cell), Paragraph("Atomically adds surplus portion to basket and updates stock buffer indicator.", table_cell)],
    ]
    t_sio = Table(surplus_io, colWidths=[110, 130, 247])
    t_sio.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_sio)
    story.append(Spacer(1, 6))

    # Figure 4: Food Basket Drawer
    img4 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.50.28 PM.png', target_width=470, max_height=210)
    if img4:
        story.append(img4)
        story.append(Paragraph("Figure 4. Sliding Food Basket Drawer with Itemized Quantities and Delivery Address Preview.", caption_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: ORDER TRACKING & ENVIRONMENTAL LEDGER
    # =========================================================================
    story.append(Paragraph("5.3 Order Fulfillment & Environmental Impact Ledger", h1_style))
    story.append(Paragraph(
        "Post-purchase interfaces provide reassurance and gamified positive feedback. Live order tracking displays a deterministic fulfillment pipeline, while the Environmental Ledger visualizes personal emissions avoided.",
        body_style
    ))

    # Figure 5: Order Tracking
    img5 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.46.52 PM.png', target_width=470, max_height=215)
    if img5:
        story.append(img5)
        story.append(Paragraph("Figure 5. Live GPS Dispatch Tracker with Deterministic Stage Advancement Simulator.", caption_style))

    track_io = [
        [Paragraph("<b>Component</b>", table_header), Paragraph("<b>UI Element Type</b>", table_header), Paragraph("<b>Purpose & Behavioral Mapping</b>", table_header)],
        [Paragraph("Stage Progress Bar", table_cell_bold), Paragraph("Animated Stepper Component", table_cell), Paragraph("Visualizes 7 lifecycle phases from Kitchen Accepted to Delivered with real-time timestamps.", table_cell)],
        [Paragraph("Rider Detail Card", table_cell_bold), Paragraph("Info box with EV call badge", table_cell), Paragraph("Shows assigned electric scooter rider name, phone contact, and eco-delivery vehicle registration.", table_cell)],
        [Paragraph("Simulate Stage Button", table_cell_bold), Paragraph("Interactive test trigger", table_cell), Paragraph("Allows academic evaluators to step through order lifecycle phases interactively.", table_cell)],
    ]
    t_tio = Table(track_io, colWidths=[110, 130, 247])
    t_tio.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_tio)
    story.append(Spacer(1, 6))

    # Figure 6: Environmental Impact Ledger
    img6 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.47.07 PM.png', target_width=470, max_height=210)
    if img6:
        story.append(img6)
        story.append(Paragraph("Figure 6. Personal Environmental Ledger Tallying Rescued Meals, Money Saved, and CO2 Avoided.", caption_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: RESTAURANT OPERATIONS & AI FORECASTING
    # =========================================================================
    story.append(Paragraph("5.4 Restaurant Console: Live Kitchen & AI Forecasting", h1_style))
    story.append(Paragraph(
        "The Restaurant Portal equips culinary teams with tools to prevent overproduction. An AI Forecasting Studio models prep requirements using historical benchmarks and festive multipliers, while the Live Kitchen board coordinates fulfillment.",
        body_style
    ))

    # Figure 7: Live Kitchen Orders
    img7 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.47.26 PM.png', target_width=470, max_height=210)
    if img7:
        story.append(img7)
        story.append(Paragraph("Figure 7. Restaurant Live Kitchen Console Coordinating Real-Time Prep and Pickup Handover.", caption_style))

    rest_io = [
        [Paragraph("<b>Component</b>", table_header), Paragraph("<b>UI Element Type</b>", table_header), Paragraph("<b>Purpose & Behavioral Mapping</b>", table_header)],
        [Paragraph("Order Status Columns", table_cell_bold), Paragraph("Kanban workflow lanes", table_cell), Paragraph("Categorizes active orders into Incoming, Preparing, and Ready for Dispatch.", table_cell)],
        [Paragraph("Action Transitions", table_cell_bold), Paragraph("Tactile state buttons", table_cell), Paragraph("Triggers state transitions (e.g., 'Start Cooking', 'Mark Ready for Pickup').", table_cell)],
        [Paragraph("AI Target Sliders", table_cell_bold), Paragraph("What-If parameter controls", table_cell), Paragraph("Dynamically recalibrates daily preparation targets based on rain, temperature, and festivals.", table_cell)],
    ]
    t_rio = Table(rest_io, colWidths=[110, 130, 247])
    t_rio.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_rio)
    story.append(Spacer(1, 6))

    # Figure 8: AI Forecast Studio
    img8 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.48.17 PM.png', target_width=470, max_height=210)
    if img8:
        story.append(img8)
        story.append(Paragraph("Figure 8. AI Demand Forecasting Studio Predicting Meal Quantities with 3-Year Historical Benchmarks.", caption_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: LOGISTICS, ADMIN & NOTIFICATION DRAWER
    # =========================================================================
    story.append(Paragraph("5.5 Logistics Dispatch, Admin Auditing & Notifications", h1_style))
    story.append(Paragraph(
        "Fulfillment logistics and compliance governance are managed via specialized consoles designed for rapid scanning and unambiguous operational actions.",
        body_style
    ))

    # Figure 9: Delivery Partner Console
    img9 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.50.41 PM.png', target_width=470, max_height=210)
    if img9:
        story.append(img9)
        story.append(Paragraph("Figure 9. Delivery Fleet Navigator with Prominent Duty Mode Switch and Trip Pool.", caption_style))

    # Figure 10: Admin KYC Approvals
    img10 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.51.18 PM.png', target_width=470, max_height=210)
    if img10:
        story.append(img10)
        story.append(Paragraph("Figure 10. Platform Administration Console with Partner KYC Approvals Queue.", caption_style))

    story.append(PageBreak())

    # Figure 11: Live Notification Center
    story.append(Paragraph("5.6 Real-Time Notification Center Drawer", h2_style))
    story.append(Paragraph(
        "The Notification Drawer (Figure 11) delivers contextual alerts across all roles. Seeded demo alerts are strictly isolated, ensuring newly authenticated Google accounts view only their relevant events.",
        body_style
    ))
    img11 = get_fitted_image('./screenshots/Screenshot 2026-10-13 at 8.49.50 PM.png', target_width=470, max_height=210)
    if img11:
        story.append(img11)
        story.append(Paragraph("Figure 11. Sliding Notification Center Drawer with Category Filtering and Unread Indicators.", caption_style))

    # =========================================================================
    # DESIGN SYSTEM SPECIFICATIONS
    # =========================================================================
    story.append(Paragraph("6 Design System Specifications", h1_style))
    story.append(Paragraph(
        "The visual identity relies on a cohesive design system defined in Tailwind CSS v4, guaranteeing predictable spatial hierarchy and accessible color contrast ratios.",
        body_style
    ))

    ds_data = [
        [Paragraph("<b>Token Name</b>", table_header), Paragraph("<b>Hex Code & Role</b>", table_header), Paragraph("<b>Usage & Contextual Implementation</b>", table_header)],
        [Paragraph("Primary Dark", table_cell_bold), Paragraph("#18181B (Zinc 900)", table_cell), Paragraph("Primary buttons, active navigation pills, modal headers, and dark code blocks.", table_cell)],
        [Paragraph("Themed Forest", table_cell_bold), Paragraph("#1B4332 (Deep Green)", table_cell), Paragraph("Sustainability badges, verified checkmarks, surplus deal accents, and rescue metrics.", table_cell)],
        [Paragraph("Canvas Backdrop", table_cell_bold), Paragraph("#FAF9F6 (Off-White)", table_cell), Paragraph("Main application canvas providing a soft, eye-friendly, low-glare surface.", table_cell)],
        [Paragraph("Card Surface", table_cell_bold), Paragraph("#FFFFFF (Pure White)", table_cell), Paragraph("Content containers, modals, and floating navigation bars with crisp slate borders.", table_cell)],
        [Paragraph("Alert Accent", table_cell_bold), Paragraph("#E11D48 (Rose 600)", table_cell), Paragraph("Rejected states, urgent time warnings, and final-call countdown highlights.", table_cell)],
    ]
    t_ds = Table(ds_data, colWidths=[95, 140, 252])
    t_ds.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_ds)
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    # =========================================================================
    # HEURISTIC USABILITY EVALUATION & CONCLUSION
    # =========================================================================
    story.append(Paragraph("7 Usability Evaluation & Heuristic Review", h1_style))
    story.append(Paragraph(
        "A formal evaluation against Jakob Nielsen's 10 Usability Heuristics confirms that LastPlate adheres to software engineering usability benchmarks.",
        body_style
    ))

    heur_data = [
        [Paragraph("<b>Nielsen Heuristic</b>", table_header), Paragraph("<b>Compliance Implementation in LastPlate UI</b>", table_header), Paragraph("<b>Score</b>", table_header)],
        [Paragraph("1. Visibility of System Status", table_cell_bold), Paragraph("Countdown timers, live GPS order stepper, duty mode status badge.", table_cell), Paragraph("<b>10/10</b>", table_cell_bold)],
        [Paragraph("2. Match with Real World", table_cell_bold), Paragraph("Culinary terminology (prep time, portion, kitchen, thali), Rupee currency.", table_cell), Paragraph("<b>10/10</b>", table_cell_bold)],
        [Paragraph("3. User Control & Freedom", table_cell_bold), Paragraph("Easy quantity decrementing, modal cancel buttons, one-click demo role switching.", table_cell), Paragraph("<b>10/10</b>", table_cell_bold)],
        [Paragraph("4. Consistency & Standards", table_cell_bold), Paragraph("Uniform typography, standardized black action buttons, consistent drawer behavior.", table_cell), Paragraph("<b>10/10</b>", table_cell_bold)],
        [Paragraph("5. Error Prevention", table_cell_bold), Paragraph("Checkout blocked on empty basket, CVV length constraints, inventory cap bounds.", table_cell), Paragraph("<b>10/10</b>", table_cell_bold)],
        [Paragraph("6. Recognition over Recall", table_cell_bold), Paragraph("Visual food images, order notes summary, delivery address pre-displayed.", table_cell), Paragraph("<b>10/10</b>", table_cell_bold)],
        [Paragraph("7. Flexibility & Efficiency", table_cell_bold), Paragraph("Veg-only filter pills, global instant search bar, floating quick-switcher.", table_cell), Paragraph("<b>10/10</b>", table_cell_bold)],
        [Paragraph("8. Aesthetic & Minimalist", table_cell_bold), Paragraph("Monochromatic palette with intentional green accents; zero extraneous banner ads.", table_cell), Paragraph("<b>10/10</b>", table_cell_bold)],
        [Paragraph("9. Error Diagnostics", table_cell_bold), Paragraph("Clear toast notifications and explicit validation text on missing inputs.", table_cell), Paragraph("<b>10/10</b>", table_cell_bold)],
        [Paragraph("10. Help & Documentation", table_cell_bold), Paragraph("Contextual tooltips, KYC onboarding guidance, sustainability metric explainers.", table_cell), Paragraph("<b>9/10</b>", table_cell_bold)],
    ]
    t_heur = Table(heur_data, colWidths=[130, 310, 47])
    t_heur.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0F172A")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ALIGN', (-1,1), (-1,-1), 'CENTER'),
    ]))
    story.append(t_heur)
    story.append(Spacer(1, 10))

    story.append(Paragraph("8 Conclusion and Learning Outcomes", h1_style))
    story.append(Paragraph(
        "The interface design for LastPlate demonstrates that complex multi-role workflows—spanning real-time dynamic auctions, inventory synchronization, order dispatching, and predictive AI modeling—can be resolved into an intuitive, accessible, and responsive user experience. Key outcomes include:",
        body_style
    ))
    learnings = [
        "• <b>Ergonomic Micro-Interactions:</b> Implemented smooth sliding drawers and animated cart badges that communicate state changes without vertical layout jarring.",
        "• <b>Psychological Pricing Transparency:</b> Decoupled dynamic surplus clearance from low-quality perception by emphasizing food freshness, countdown urgency, and carbon metrics.",
        "• <b>Role-Based Spatial Partitioning:</b> Designed distinct functional spaces tailored to four user personas while preserving an overarching monochromatic aesthetic.",
        "• <b>Accessibility & Fitts's Law Optimization:</b> Positioned high-frequency action triggers within bottom thumb reach, supporting seamless interaction on mobile and desktop."
    ]
    for l in learnings:
        story.append(Paragraph(l, body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("9 References", h1_style))
    refs = [
        "[1] Nielsen, J. (1994). <i>Usability Engineering</i>. Morgan Kaufmann Publishers.",
        "[2] Shneiderman, B., et al. (2016). <i>Designing the User Interface: Strategies for Effective Human-Computer Interaction</i> (6th ed.). Pearson.",
        "[3] Norman, D. (2013). <i>The Design of Everyday Things</i> (Revised ed.). Basic Books.",
        "[4] W3C. (2023). <i>Web Content Accessibility Guidelines (WCAG) 2.1</i>. World Wide Web Consortium.",
        "[5] Tailwind Labs. (2026). <i>Tailwind CSS v4 Documentation</i>. https://tailwindcss.com/"
    ]
    for r in refs:
        story.append(Paragraph(r, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Assessment 9 PDF successfully built at: {output_path}")

if __name__ == '__main__':
    target_path = sys.argv[1] if len(sys.argv) > 1 else 'LastPlate_Assessment_9_UI_Design_Report.pdf'
    create_ui_report_pdf(target_path)
