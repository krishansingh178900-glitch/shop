# ✦ SKYLIX Haute Coiffure & Salon — Website & Admin Suite

> A modern, premium, black-and-gold luxury salon website featuring an integrated dynamic portfolio and a fully functional Admin Panel backed by **Supabase** (Auth, Database, and Cloud Storage) ready for instant deployment to **Vercel**.

---

## 🔗 Direct Local Access Links (Server Running)

| Destination | Local URL | File Path |
| :--- | :--- | :--- |
| **Public Website** | [http://localhost:3000/](http://localhost:3000/) | [index.html](file:///c:/Users/LENOVO/Videos/shop/index.html) |
| **Admin Portal** | [http://localhost:3000/admin/](http://localhost:3000/admin/) | [admin/index.html](file:///c:/Users/LENOVO/Videos/shop/admin/index.html) |
| **SQL Schema** | — | [supabase/schema.sql](file:///c:/Users/LENOVO/Videos/shop/supabase/schema.sql) |
| **Server Script** | — | [server.ps1](file:///c:/Users/LENOVO/Videos/shop/server.ps1) |
| **1-Click Launcher** | — | [start-server.bat](file:///c:/Users/LENOVO/Videos/shop/start-server.bat) |
| **Project Root Folder** | — | [file:///c:/Users/LENOVO/Videos/shop/](file:///c:/Users/LENOVO/Videos/shop/) |

---

## 🌟 Key Highlights & Architecture

- **Public Website:**
  - **Aesthetics:** Sleek black, white, and burnished gold palette (`#070708`, `#D4AF37`, `#F5E08F`).
  - **Typography:** Cormorant Garamond (Serif), Cinzel (Display), and Plus Jakarta Sans (Modern UI).
  - **Sections:**
    1. Navigation bar with responsive mobile menu & direct staff admin link.
    2. Hero section featuring custom photography, gold gradient headline, and luxury metrics bar.
    3. About the Salon with philosophy, master stylist craft showcase, and brand pillars.
    4. Haircuts & Hairstyles showcase cards with duration and starting prices.
    5. Services & Transparent Pricing with interactive category tabs and 1-click booking actions.
    6. **Dynamic Photo Gallery:** Loads directly from Supabase with category filtering and high-resolution fullscreen Lightbox.
    7. Client Acclaim / Testimonials with star ratings and client reviews.
    8. **Bespoke WhatsApp Appointment Concierge:** Generates pre-formatted WhatsApp appointment booking messages with name, service, stylist, and time.
    9. Location & Hours with interactive Google Maps embed and contact information.
    10. Footer with opening hours, social links, newsletter, and discrete admin link.
    11. Floating persistent WhatsApp contact trigger.

- **Admin Portal (`/admin`):**
  - **Secure Authentication:** Protected admin dashboard guarded by Supabase Auth (`supabase.auth.signInWithPassword`).
  - **Dashboard Overview:** Live counts for total gallery photos, active categories, and cloud storage status.
  - **Photo Upload Suite:**
    - Drag-and-drop file uploader with instant image preview.
    - Supports JPG, JPEG, PNG, and WebP (up to 10MB).
    - Metadata controls: Title, Category, Description notes, "Featured in Showcase" toggle, and Display Order.
    - Uploads directly to Supabase Storage bucket (`gallery-images`).
    - Creates records in the PostgreSQL `gallery` table.
    - Animated progress bar and toast notifications.
  - **Live Gallery Management:**
    - Dynamic photos grid with category tags, descriptions, and timestamps.
    - Live search filter and category pill filters.
    - **Permanent Delete Action:** Custom modal confirmation that simultaneously deletes the PostgreSQL database record AND the physical cloud image in Supabase Storage.
    - Real-time updates reflect immediately on the public website.
  - **In-App Supabase Setup Assistant:**
    - Live credentials configuration drawer in the UI.
    - One-click **"Test Live Connection"** button that pings the database table and checks storage bucket access.
    - One-click **"Copy schema.sql"** button.

- **Security & Privacy:**
  - Zero exposed secret keys. Only the public `anon` key is used on the client.
  - Complete PostgreSQL **Row Level Security (RLS)** policies:
    - Public visitors can only view published images (`SELECT`).
    - Only authenticated administrators can upload (`INSERT`) or delete (`DELETE`) photos.

---

## 📁 Project Structure

```
shop/
├── index.html                   # Public Luxury Salon Website
├── admin/
│   └── index.html               # SKYLIX Admin Portal (Auth, Upload, Management, Config)
├── css/
│   ├── style.css                # Master luxury stylesheet (Black & Gold design system)
│   └── admin.css                # Admin panel layout, dropzones, modals, tables, toasts
├── js/
│   ├── config.js                # Public configuration & fallback parameters
│   ├── supabase.js              # Supabase Client, Auth, Storage & Database operations
│   ├── main.js                  # Public site logic: tabs, gallery loader, lightbox, WhatsApp concierge
│   └── admin.js                 # Admin panel logic: auth guard, file validation, cloud upload/delete
├── assets/
│   ├── images/                  # High-resolution luxury photography
│   │   ├── hero-salon.jpg       # Luxury salon interior
│   │   ├── about-stylist.jpg    # Master stylist craft
│   │   ├── balayage.jpg         # Sun-kissed golden balayage
│   │   ├── french-bob.jpg       # Parisian precision blunt bob
│   │   ├── bridal-updo.jpg      # Couture bridal chignon
│   │   ├── executive-fade.jpg   # Men's executive fade
│   │   └── silk-treatment.jpg   # Liquid silk restorative treatment
│   └── logo.svg                 # Vector SKYLIX luxury crest & monogram
├── supabase/
│   └── schema.sql               # Complete SQL schema, RLS policies, bucket setup & policies
├── vercel.json                  # Vercel configuration (routing /admin -> /admin/index.html & headers)
├── .env.example                 # Environment variables reference
├── server.ps1                   # Native Windows PowerShell development web server
├── start-server.bat             # 1-Click Windows server launcher
└── README.md                    # Project documentation
```

---

## 🚀 Quick Start (Running Locally)

### Option 1: Native Windows Launcher (Recommended)
Double-click `start-server.bat` in the project root, or open PowerShell and run:
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
```
The server will start instantly:
- **Public Website:** `http://localhost:3000/`
- **Admin Portal:** `http://localhost:3000/admin/`

*(No Node.js or Python installation required — uses Windows built-in .NET HttpListener).*

### Option 2: Using Any Static Server
You can also use any local web server:
```bash
# Python
python -m http.server 3000

# or Node / npx
npx serve .
```

---

## ⚡ Supabase Setup (Step-by-Step)

Follow these steps to connect your own Supabase project:

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account or sign in.
2. Click **New Project**, choose a project name (e.g., `skylix-salon`), and set a database password.

### Step 2: Run the SQL Schema
1. In your Supabase Project Dashboard, click **SQL Editor** from the left sidebar.
2. Open `supabase/schema.sql` from this repository, copy its full content, and paste it into the SQL editor.
3. Click **Run**. This will:
   - Create the `gallery` table with proper indexes.
   - Enable Row Level Security (RLS) on `gallery`.
   - Create public view and admin upload/delete policies.
   - Create the public storage bucket `gallery-images`.
   - Set up storage bucket RLS policies for uploads and deletes.

### Step 3: Create Your Administrator Account
1. In the Supabase dashboard, click **Authentication** in the left sidebar.
2. Go to **Users** and click **Add User** &gt; **Create User**.
3. Enter your administrator email (e.g. `admin@skylixsalon.com`) and choose a secure password.
4. Check **Auto Confirm User?** to mark the email as verified immediately.
5. Click **Create User**.

### Step 4: Connect Credentials in the Admin Portal
1. In your Supabase dashboard, go to **Project Settings** &gt; **API**.
2. Copy your **Project URL** and the **anon (public)** key.
3. Open the SKYLIX Admin Portal at `http://localhost:3000/admin/`.
4. Click **Supabase Settings** (top right or on the login page).
5. Paste your **Project URL** and **Anon Public Key**.
6. Click **Test Live Connection**. You will see:
   ```
   ✓ Connection successful! Found 0 photos in gallery table.
   ```
7. Click **Save Credentials & Connect**.
8. Sign in with the administrator email and password you created in Step 3!

---

## 🧪 Testing the Complete Workflow

1. **Verify Public Website:**
   - Open `http://localhost:3000/`.
   - Scroll through the About, Hairstyles, Services, Gallery, and Testimonials sections.
   - Click a photo in the gallery to open the fullscreen Lightbox.
   - Select a service from the menu and click "Book Service" to test the WhatsApp concierge.

2. **Test Admin Login:**
   - Go to `http://localhost:3000/admin/`.
   - Enter your administrator credentials.
   - Verify that unauthorized users are kept on the login screen.

3. **Upload a Photo:**
   - In the Admin dashboard, drag and drop an image into the upload area (or choose one from `assets/images/`).
   - Enter a title (e.g. *"Golden Honey Balayage Waves"*), pick a category, and optionally check *"Mark as Featured"*.
   - Click **Upload & Publish Photo**.
   - Watch the animated progress bar complete.

4. **Verify Live Gallery Update:**
   - Open `http://localhost:3000/` in another tab.
   - The newly uploaded photo appears dynamically in the public gallery under its category!

5. **Test Photo Deletion:**
   - In the Admin Portal, find the uploaded photo in the Gallery Photos list.
   - Click the red **Delete** button.
   - Confirm in the prompt modal: *"Yes, Delete Photo"*.
   - The photo is removed from both the PostgreSQL database and Supabase Storage.
   - Check the public website: the photo is gone immediately without needing any code changes or redeployment!

---

## 🌐 Deploying to Vercel

The project is structured with a pre-configured `vercel.json` file for zero-configuration Vercel deployment.

### Deploying via Vercel Dashboard
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Sign in to [vercel.com](https://vercel.com) and click **Add New** &gt; **Project**.
3. Import your salon repository.
4. Leave Build and Output settings as default (Framework Preset: **Other**).
5. (Optional) Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
6. Click **Deploy**.

### Deploying via Vercel CLI
```bash
# If you have Vercel CLI installed:
vercel
```

### Custom Domain Configuration
1. In your Vercel Project Dashboard, navigate to **Settings** &gt; **Domains**.
2. Enter your custom domain (e.g. `skylixsalon.com` or `atelier.yourdomain.com`).
3. Follow Vercel's DNS instructions to add the `CNAME` or `A` records to your domain registrar.
4. Vercel automatically generates free SSL/TLS certificates.

---

## 🔒 Security Best Practices

- **Row Level Security (RLS):** Every row in the `gallery` table and every object in the `gallery-images` bucket is protected by PostgreSQL RLS.
- **Client Key Safety:** Only the public `anon` key is used in client-side code. This key cannot perform unauthorized operations because RLS policies require `auth.role() = 'authenticated'`.
- **Never Expose `service_role` Key:** The `service_role` secret key bypasses all RLS checks and must never be placed in frontend files or public repositories.

---

## 📜 License
Realistic Demo Project created for demonstration purposes. Free to customize and adapt for salon clients.
