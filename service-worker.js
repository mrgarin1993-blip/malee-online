self.addEventListener('install', (event) => {
    console.log('Service Worker: ติดตั้งเรียบร้อย');
});

self.addEventListener('fetch', (event) => {
    // ปล่อยผ่านการโหลดข้อมูลปกติไปเลย ไม่ต้องกั้นแคชอะไรให้วุ่นวาย
});

