# Bentuk Komponen & Animasi (Micro-Interactions)

## 1. Bentuk (Shapes) & Gaya Kartu (Cards)
Estetika Tres Bros tidak terasa kaku. Keseluruhan aplikasi didesain dengan lengkungan lembut dan elegan.
*   **Rounded Corners**: Tombol utama dan kartu pesanan menggunakan radius sudut menengah ke besar (`rounded-xl` hingga `rounded-2xl` di Tailwind).
*   **Glassmorphism (Efek Kaca Semi-Transparan)**:
    *   *Sidebar* pada Kasir atau *Background Modal* (Pop-up) menggunakan warna semi-transparan `bg-opacity-80` yang dipadukan dengan efek *blur* latar (`backdrop-blur-md`).
    *   Pendekatan ini menciptakan lapisan ketebalan (*depth*) yang mewah dan *modern*, sangat sejalan dengan nuansa *earthy premium* Tres Bros.

## 2. Efek Sentuh & Hover (Interaksi Kasir)
*   **Kartu Menu (POS)**: Saat disorot mouse (*hover*), kartu akan naik sedikit (`translate-y-1`) dan warna *border* / pinggirannya menyala menggunakan warna `Warm Brown` (`border-[#A16B3D]`) untuk menandakan item siap diklik/dimasukkan keranjang.
*   **Tombol Navigasi**: Menggunakan transisi pudar (*fade*) `duration-200` agar pergantian warna (*hover state*) terasa *smooth* dan tidak mengejutkan mata.

## 3. Animasi Papan Dapur (Kitchen Display System)
Di layar dapur, staf tidak menatap aplikasi untuk bersantai, melainkan bekerja di bawah tekanan waktu. *Feedback* visual harus instan namun tidak mengganggu.
*   **Pesanan Baru Masuk**: Dianimasikan muncul (*fade-in*) dan terangkat perlahan (*slide-up*) agar staf sadar ada tambahan kerjaan baru tanpa ada kedipan kasar di layar.
*   **Geser Pesanan (Drag and Drop Kanban)**: Menggunakan kurva pegas (*spring physics*) agar pergerakan kartu dari "Antrean" ke kolom "Selesai" terasa natural dan responsif saat ditarik (*drag*).
*   **Peringatan Waktu (Timer SLA)**: Ketika pesanan menunggu terlalu lama dan melebihi batas standar pelayanan, angka indikator waktu akan berkedip pelan (animasi *pulse* merah `#C53030`) sebagai *alert* proaktif ke koki.
