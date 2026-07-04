// ==========================================
// ส่วนที่ 0: กุญแจเชื่อมต่อฐานข้อมูล Firebase
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBeINoG8WXEOtCF8kTpVD-tl4sbjKD9sgY",
  authDomain: "malee-online-b0afe.firebaseapp.com",
  projectId: "malee-online-b0afe",
  storageBucket: "malee-online-b0afe.firebasestorage.app",
  messagingSenderId: "167732521595",
  appId: "1:167732521595:web:80c4c599e43a034d4310de",
  measurementId: "G-V2ZDCRMRX9"
};

// สั่งเปิดใช้งาน Firebase และสร้างตัวแปร db ไว้รอรับส่งข้อมูล
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// ==========================================


// ==========================================
// ส่วนที่ 1: ตัวแปรหลักของระบบ (วางไว้บนสุดเลย)
// ==========================================
let cartItemsStore1 = []; // เอาไว้เก็บรายการสินค้าที่ลูกค้ากดลงตะกร้า
let totalAmountStore1 = 0; // เอาไว้เก็บยอดเงินรวม
let currentCategoryStore1 = ""; // เอาไว้จำว่าตอนนี้ลูกค้าอยู่หน้าหมวดหมู่ไหน
 // localStorage.clear();
 
 // ดักจับตอนโหลดหน้าเว็บเพื่อเช็คประวัติและดึงข้อมูลมาโชว์
document.addEventListener("DOMContentLoaded", function() {
    
    let existingMemberId = localStorage.getItem('memberIdStore1');
    let welcomeModal = document.getElementById('welcome-modal-store1');

    if (!existingMemberId) {
        // ถ้ายังไม่มีรหัสในความจำ บังคับโชว์ป๊อปอัป
        if (welcomeModal) welcomeModal.style.display = 'flex';
    } else {
        // ถ้าเคยมีรหัสแล้ว ซ่อนป๊อปอัป
        if (welcomeModal) welcomeModal.style.display = 'none';
    }

    // *** สั่งให้ระบบดึงข้อมูลชื่อและไอดีมาโชว์ที่หน้าหลักและหน้าโปรไฟล์ทันที ***
    if (typeof updateProfilePageData === "function") {
        updateProfilePageData();
    }
});
// ==========================================
// 📌 ดึงข้อมูลสินค้าจาก Firebase มาแสดงหน้าบ้าน (แทนที่ของปลอม)
// ==========================================
// สร้างตัวแปรเก็บสินค้าแบบว่างๆ ไว้ก่อน (เปลี่ยนจาก const เป็น let จะได้อัปเดตข้อมูลได้)
let products = {};

async function fetchProductsFromFirebase() {
    try {
        console.log("กำลังดูดข้อมูลสินค้าจากหลังบ้าน...");
        const snapshot = await db.collection("products").get();
        products = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.isSelling === false) return; 

            if (!products[data.category]) {
                products[data.category] = [];
            }

            products[data.category].push({
                id: doc.id,
                name: data.name,
                price: data.price,
                wholesale: data.vipPrice || 0,
                img: data.imageUrl || "📦" // <--- เก็บลิงก์รูปตรงๆ
            });
        });

        console.log("🔥 โหลดสินค้าจาก Firebase เสร็จแล้วว่ะตี๋!", products);
        
        if (currentCategoryStore1) {
            openCategory(currentCategoryStore1);
        }

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล: ", error);
    }
}


// สั่งให้ระบบเริ่มดูดข้อมูลทันทีที่เปิดแอปหน้าบ้าน
fetchProductsFromFirebase();
// ==========================================
// ส่วนที่ 3: ฟังก์ชันสลับหน้าและดึงสินค้ามาแสดง
// ==========================================

// ตัวแปรสำหรับป๊อปอัป
let currentProduct = null;
let currentQty = 1;
// ฟังก์ชันเปิดหน้าโปรไฟล์
function openProfile() {
    let mainPage = document.getElementById('main-page-store1');
    if (mainPage) mainPage.style.display = 'none';

    let subPage = document.getElementById('sub-category-page-store1');
    if (subPage) subPage.style.display = 'none';

    let topSection = document.querySelector('.sticky-top-section');
    if (topSection) topSection.style.display = 'none';

    let profilePage = document.getElementById('profile-page-store1');
    if (profilePage) profilePage.style.display = 'block';

    // *** สั่งให้อัปเดตข้อมูลมาโชว์ทุกครั้งที่กางหน้าโปรไฟล์ ***
    updateProfilePageData();
}

// โลจิกปุ่มยุบ/โชว์ รหัสพ่อค้าแม่ค้า
let isCodeHidden = true;

function toggleMerchantCode() {
    let codeBox = document.getElementById('merchant-code-toggle');
    if (codeBox) {
        if (isCodeHidden) {
            // เดี๋ยวพอนายทำระบบหลังบ้านเสร็จ ค่อยเอาตัวแปรรหัสจริงๆ มาใส่แทน "รหัสลับ1234" ได้เลยนะ
            codeBox.innerText = "รหัสลับ1234"; 
            isCodeHidden = false;
        } else {
            codeBox.innerText = "******";
            isCodeHidden = true;
        }
    }
}

function openCategory(categoryName) {
    document.getElementById('main-page-store1').style.display = 'none';
    
    let searchSec = document.querySelector('.search-section');
    if(searchSec) searchSec.style.display = 'none';

    let h2Tags = document.getElementsByTagName('h2');
    for(let i = 0; i < h2Tags.length; i++) {
        if(h2Tags[i].innerText === 'เมนูเลือกชนิดสินค้า') {
            h2Tags[i].parentElement.style.display = 'none';
        }
    }
    
    document.getElementById('sub-category-page-store1').style.display = 'block';
    document.getElementById('sub-category-title').innerText = categoryName;
    currentCategoryStore1 = categoryName;

    let productContainer = document.getElementById('product-list-container');
    productContainer.style.display = 'grid';
    productContainer.style.gridTemplateColumns = '1fr 1fr';
    productContainer.style.gap = '15px';
    productContainer.innerHTML = ""; 
    
    let items = products[categoryName];
    
    if (items && items.length > 0) {
        let htmlStr = "";
        for (let i = 0; i < items.length; i++) {
            let p = items[i];
            
            let imgBoxStyle = (p.img !== "📦") 
                ? `background-image: url('${p.img}'); background-size: cover; background-position: center;`
                : `background: #f0f0f0; color: #333; font-size: 30px; display: flex; align-items: center; justify-content: center;`;
            
            let iconText = (p.img !== "📦") ? "" : "📦";

            htmlStr += `
            <div onclick="openModal('${p.id}')" style="background: white; border-radius: 15px; padding: 15px 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer;">
                <div id="prod-img-box" style="width: 100%; height: 70px; border-radius: 8px; margin-bottom: 10px; ${imgBoxStyle}">${iconText}</div>
                <h3 style="font-size: 14px; margin: 0 0 5px 0; color: #333;">${p.name}</h3>
                <p style="color: #ff4b2b; font-weight: bold; margin: 0; font-size: 16px;">฿${p.price}</p>
            </div>
            `;
        }
        productContainer.innerHTML = htmlStr;
    } else {
        productContainer.style.display = 'block'; 
        productContainer.innerHTML = "<p style='text-align:center; color:#999; margin-top: 20px;'>กำลังอัปเดตสินค้าจ้า...</p>";
    }
}


// ฟังก์ชันกลับหน้าหลัก
function goHome() {
    let profilePage = document.getElementById('profile-page-store1');
    if (profilePage) profilePage.style.display = 'none';

    let subPage = document.getElementById('sub-category-page-store1');
    if (subPage) subPage.style.display = 'none';

    let topSection = document.querySelector('.sticky-top-section');
    if (topSection) topSection.style.display = 'block';

    let mainPage = document.getElementById('main-page-store1');
    if (mainPage) mainPage.style.display = 'block';
    
    // --- จุดนี้กูแก้ให้แล้ว แถบค้นหาจะเด้งกลับมาโชว์! ---
    let searchSec = document.querySelector('.search-section');
    if(searchSec) searchSec.style.display = 'block'; 
    // ----------------------------------------------

    let h2Tags = document.getElementsByTagName('h2');
    for(let i = 0; i < h2Tags.length; i++) {
        if(h2Tags[i].innerText === 'เมนูเลือกชนิดสินค้า') {
            h2Tags[i].parentElement.style.display = 'block';
        }
    }
    currentCategoryStore1 = "";
}


// ==========================================
// ส่วนที่ 4: ระบบควบคุมป๊อปอัป (ใช้โค้ดเดิมของตี๋ แค่แก้ให้ดึงรูป imageUrl)
// ==========================================
function openModal(productId) {
    let foundProduct = null;
    Object.values(products).forEach(catItems => {
        let item = catItems.find(p => p.id === productId);
        if (item) foundProduct = item;
    });

    if (!foundProduct) return;

    currentProduct = foundProduct;
    currentQty = 1;

    let modalImg = document.getElementById('modal-img-store1');
    
    // 🔥 ดักจับรูปภาพตรงนี้จุดเดียว
    let finalImg = currentProduct.imageUrl || currentProduct.img; 

    if (finalImg && finalImg !== "📦") {
        modalImg.innerHTML = `<img src="${finalImg}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
    } else {
        modalImg.innerHTML = "📦";
    }
    
    document.getElementById('modal-name-store1').innerText = currentProduct.name;
    document.getElementById('modal-price-unit-store1').innerText = `฿${currentProduct.price} / ชิ้น`;
    document.getElementById('modal-qty-store1').innerText = currentQty;
    
    updateModalPrice();
    document.getElementById('product-modal-store1').style.display = 'flex';
}


function closeModal() {
    document.getElementById('product-modal-store1').style.display = 'none';
}

function changeQty(amount) {
    currentQty += amount;
    if (currentQty < 1) currentQty = 1; // ล็อกไม่ให้จำนวนติดลบหรือเป็น 0
    document.getElementById('modal-qty-store1').innerText = currentQty;
    updateModalPrice();
}

function updateModalPrice() {
    let total = currentProduct.price * currentQty;
    document.getElementById('modal-confirm-btn').innerText = `ตกลง (รวม ฿${total})`;
}

function confirmSelection() {
    if (!currentProduct) return;

    // 🔥 1. เช็คว่ามีสินค้านี้ในตะกร้าหรือยัง (เปลี่ยนมาเช็คด้วย ID แทน Name)
    let existingItem = cartItemsStore1.find(item => item.id === currentProduct.id);
    
    if (existingItem) {
        // ถ้ามีแล้ว ให้บวกจำนวนเพิ่มเข้าไป
        existingItem.qty += currentQty;
    } else {
        // 🔥 ถ้ายังไม่มี ให้เพิ่มของชิ้นใหม่ลงตะกร้า (เพิ่มเซฟ id และรองรับรูปภาพ imageUrl)
        cartItemsStore1.push({
            id: currentProduct.id, 
            name: currentProduct.name,
            price: currentProduct.price,
            img: currentProduct.imageUrl || currentProduct.img || '', // รองรับทั้งชื่อเก่าและใหม่
            qty: currentQty
        });
    }

    // 2. สั่งอัปเดตตัวเลขที่ปุ่มตะกร้าสีส้ม
    if (typeof updateCartSummary === 'function') {
        updateCartSummary();
    }
    
    // 3. ปิดป๊อปอัป (ของเดิมของตี๋)
    closeModal();
}


//.....บล็อกโค้ดชุดตัดรูปใส่โปรไฟล์.....//
function previewProfileImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('crop-preview-img-store1');
            img.src = e.target.result;
            currentZoom = 1;
            document.getElementById('crop-zoom-store1').value = 1;
            
//[j1.0193]//
            img.style.transform = `translate(-50%, -50%) scale(1)`;
            img.style.top = '50%';
            img.style.left = '50%';
            img.style.transformOrigin = 'center center';
//[j1.0194]//
            document.getElementById('crop-modal-store1').style.display = 'flex';
            initZoomEvents();
        }
//[j1.0195]//
        reader.readAsDataURL(input.files[0]);
    }
}
//[j1.0196]//
function closeCropModal() {
//[j1.0197]//
    document.getElementById('crop-modal-store1').style.display = 'none';
//[j1.0198]//
    document.getElementById('profile-upload-store1').value = '';
}
//[j1.0199]//
function initZoomEvents() {
    const img = document.getElementById('crop-preview-img-store1');
    const zoomInput = document.getElementById('crop-zoom-store1');

//[j1.0200]//
        zoomInput.oninput = function() {
        currentZoom = this.value;
//[j1.0201]//
        img.style.transform = `translate(-50%, -50%) scale(${currentZoom})`;
    };
}
//[j1.0202]//
function saveCroppedImage() {
    const img = document.getElementById('crop-preview-img-store1');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
//[j1.0203]//
    canvas.width = 300; canvas.height = 300;

//[j1.0204]//
    const ratio = img.naturalWidth / img.offsetWidth;

//[j1.0205]//
    const srcWidth = (250 / currentZoom) * ratio;  
    const srcHeight = (250 / currentZoom) * ratio; 
    const srcX = (img.naturalWidth - srcWidth) / 2;   
    const srcY = (img.naturalHeight - srcHeight) / 2; 
    ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, 300, 300);
    croppedImageBase64 = canvas.toDataURL('image/png');

//[j1.0206]//
    const avatarIcon = document.getElementById('header-avatar-img-store1');
    if (avatarIcon) {
        avatarIcon.innerHTML = '';
        avatarIcon.style.backgroundImage = `url('${croppedImageBase64}')`;
        avatarIcon.style.backgroundSize = 'cover';
        avatarIcon.style.backgroundPosition = 'center';
    }
//[j1.0207]//
    const avatarBox = document.querySelector('#main-header-store1 .avatar-box');
    if (avatarBox) {
        avatarBox.onclick = openBigProfileModal;
    }
    // โลจิกส่งรูปไปหน้าโปรไฟล์ย่อย
    let profileSubAvatar = document.getElementById('profile-page-avatar');
    let profileSubPlaceholder = document.getElementById('profile-page-placeholder');
    
    if (profileSubAvatar && profileSubPlaceholder) {
        // เอารูปที่เพิ่งตัดเสร็จ (croppedImageBase64) ไปยัดใส่แท็ก img
        profileSubAvatar.src = croppedImageBase64;
        profileSubAvatar.style.display = 'block'; // สั่งให้โชว์รูป
        profileSubPlaceholder.style.display = 'none'; // สั่งซ่อนคำว่า "รูปโปรไฟล์"
    }

//[j1.0208]//
    closeCropModal();

        document.getElementById('big-profile-modal-store1').style.display = 'none';

}
// คำสั่งเปิดหน้าต่างดูรูปโปรไฟล์ใหญ่
function openBigProfileModal() {
    if(!croppedImageBase64) {
        // ถ้ายังไม่มีรูปโปรไฟล์ ให้ข้ามไปเปิดหน้าเลือกรูปใหม่ในมือถือเลย
        document.getElementById('profile-upload-store1').click();
        return;
    }
    // ถ้ามีรูปแล้ว ให้เอารูปมาใส่กล่องใหญ่แล้วโชว์ขึ้นมา
    document.getElementById('big-profile-image-store1').src = croppedImageBase64;
    document.getElementById('big-profile-modal-store1').style.display = 'flex';
}

// คำสั่งปิดหน้าต่างรูปโปรไฟล์ใหญ่
function closeBigProfileModal() {
    document.getElementById('big-profile-modal-store1').style.display = 'none';
}
// ==========================================
// ส่วนที่ 4:ป๊อปอัปจ้อมูล ระบบลงทะเบียนและสร้างรหัสสมาชิก
// ==========================================

// ฟังก์ชันดึงข้อมูลจากความจำมาโชว์ที่หน้าโปรไฟล์ย่อย และหน้าหลัก
function updateProfilePageData() {
    let savedNickname = localStorage.getItem('memberNicknameStore1');
    let savedPhone = localStorage.getItem('memberPhoneStore1');
    let savedMemberId = localStorage.getItem('memberIdStore1');

    if (savedNickname) {
        // 1. อัปเดตชื่อในหน้าโปรไฟล์ย่อย
        let nickEl = document.getElementById('profile-sub-nickname');
        if (nickEl) nickEl.innerText = savedNickname;
        
        // 2. อัปเดตชื่อใต้รูปโปรไฟล์ในหน้าหลัก (จุดที่เพิ่มใหม่)
        let headerNameEl = document.getElementById('header-user-name-store1');
        if (headerNameEl) headerNameEl.innerText = savedNickname;
    }
    if (savedMemberId) {
        let idEl = document.getElementById('profile-sub-id');
        if (idEl) idEl.innerText = "ID : " + savedMemberId;
    }
    if (savedPhone) {
        let phoneEl = document.getElementById('profile-sub-phone');
        if (phoneEl) phoneEl.innerText = savedPhone;
    }
}


// ==========================================
// ส่วนที่4:จบตรงนีั ป๊อปอัประบบลงทะเบียนและสร้างรหัสสมาชิก
// ==========================================

// ==========================================
// ส่วนเชื่อมข้อมูลป๊อปอัป (วางต่อท้ายสุดของไฟล์ app.js)
// ==========================================
function submitWelcomeData() {
    let nickname = document.getElementById('reg-nickname').value.trim();
    let phone = document.getElementById('reg-phone').value.trim();
    let isChecked = document.getElementById('reg-policy').checked;

    // 1. เช็คชื่อเล่น
    if (nickname === "") {
        alert("กรุณากรอกชื่อเล่นด้วยครับ");
        return;
    }

    // 2. เช็คเบอร์โทร: ต้องเป็นตัวเลข 10 หลัก และต้องขึ้นต้นด้วย 0 เท่านั้น
    let phoneRegex = /^0\d{9}$/; 
    if (!phoneRegex.test(phone)) {
        alert("เบอร์โทรศัพท์ไม่ถูกต้องครับ\n- ต้องมี 10 หลัก\n- ต้องขึ้นต้นด้วยเลข 0");
        return;
    }

    // 3. เช็คเงื่อนไข
    if (!isChecked) {
        alert("กรุณาติ๊กยอมรับเงื่อนไขก่อนนะ");
        return;
    }

    // สร้างรหัสสมาชิก
    let newMemberId = "ML" + Math.floor(1000 + Math.random() * 9000);

    // บันทึกข้อมูล
    localStorage.setItem('memberIdStore1', newMemberId);
    localStorage.setItem('memberNicknameStore1', nickname);
    localStorage.setItem('memberPhoneStore1', phone);

    // ปิดป๊อปอัป
    let modal = document.getElementById('welcome-modal-store1');
    if (modal) {
        modal.style.display = 'none';
    }

    // อัปเดตหน้าจอ
    if (typeof updateProfilePageData === 'function') {
        updateProfilePageData();
    }

    alert("ลงทะเบียนสำเร็จ! ยินดีต้อนรับ " + nickname);
// ==========================================
// ส่วนเชื่อมข้อมูลป๊อปอัป (จบตรงนี้)
// ==========================================
}

// ==========================================
// ส่วนแก้ไขข้อมูลโปรไฟล์
// ==========================================

// 1. ฟังก์ชันเปิดป๊อปอัปและดึงข้อมูลเดิมมาโชว์
function openEditProfileModal() {
    // ดึงค่าเก่าจากความจำเครื่องมาใส่รอไว้ในช่อง
    document.getElementById('edit-nickname').value = localStorage.getItem('memberNicknameStore1') || "";
    document.getElementById('edit-phone').value = localStorage.getItem('memberPhoneStore1') || "";
    document.getElementById('edit-show-id').innerText = localStorage.getItem('memberIdStore1') || "ไม่มีรหัส";
    
    // สั่งเปิดป๊อปอัป
    document.getElementById('edit-profile-modal').style.display = 'flex';
}

// 2. ฟังก์ชันปิดป๊อปอัป (กรณีกดยกเลิก)
function closeEditModal() {
    document.getElementById('edit-profile-modal').style.display = 'none';
}

// 3. ฟังก์ชันกดเซฟข้อมูล
function saveEditedProfile() {
    let newNickname = document.getElementById('edit-nickname').value.trim();
    let newPhone = document.getElementById('edit-phone').value.trim();

    // เช็คชื่อ
    if (newNickname === "") {
        alert("กรุณากรอกชื่อเล่นด้วยครับ");
        return;
    }

    // เช็คเบอร์โทร (ใช้กฎเดิมของเราเลย!)
    let phoneRegex = /^0[689]\d{8}$/; 
    if (!phoneRegex.test(newPhone)) {
        alert("เบอร์โทรศัพท์ไม่ถูกต้องครับ!\n- ต้องขึ้นต้นด้วย 06, 08, หรือ 09\n- ต้องครบ 10 หลัก");
        return;
    }

    // เอาข้อมูลใหม่ไปเซฟทับของเก่าในลิ้นชักความจำ
    localStorage.setItem('memberNicknameStore1', newNickname);
    localStorage.setItem('memberPhoneStore1', newPhone);

    // ปิดป๊อปอัป
    closeEditModal();

    // สั่งให้หน้าโปรไฟล์อัปเดตข้อมูลโชว์ทันที
    if (typeof updateProfilePageData === 'function') {
        updateProfilePageData();
    }

    alert("อัปเดตข้อมูลเรียบร้อยแล้วเพื่อน!");
}
// ==========================================
// ส่วนยืนยันข้อมูล ป๊อปอัปต้อนรับแรกสุด
// ==========================================
function submitWelcomeData() {
    let nickname = document.getElementById('reg-nickname').value.trim();
    let phone = document.getElementById('reg-phone').value.trim();
    let isChecked = document.getElementById('reg-policy').checked;

    if (nickname === "") {
        alert("กรุณากรอกชื่อเล่นด้วยนะ");
        return;
    }

    let phoneRegex = /^0[689]\d{8}$/; 
    if (!phoneRegex.test(phone)) {
        alert("เบอร์โทรศัพท์ไม่ถูกต้อง!\n- ต้องขึ้นต้นด้วย 06, 08, หรือ 09\n- ต้องครบ 10 หลัก");
        return;
    }

    if (!isChecked) {
        alert("ติ๊กยอมรับเงื่อนไขก่อนนะ");
        return;
    }

    let newMemberId = "ML" + Math.floor(1000 + Math.random() * 9000);

    localStorage.setItem('memberIdStore1', newMemberId);
    localStorage.setItem('memberNicknameStore1', nickname);
    localStorage.setItem('memberPhoneStore1', phone);

    let modal = document.getElementById('welcome-modal-store1');
    if (modal) {
        modal.style.display = 'none';
    }

    if (typeof updateProfilePageData === 'function') {
        updateProfilePageData();
    }

    alert("ลงทะเบียนสำเร็จ! ยินดีต้อนรับ " + nickname);
}
// ==========================================
// ส่วนยืนยันข้อมูล จบตรงนี้
// ==========================================

// ==========================================
// ส่วนแก้ไขข้อมูลโปรไฟล์ (วางไว้ล่างสุดของ app.js)
// ==========================================

// 1. ฟังก์ชันเปิดป๊อปอัปและดึงข้อมูลเดิมมาโชว์
function openEditProfileModal() {
    document.getElementById('edit-nickname').value = localStorage.getItem('memberNicknameStore1') || "";
    document.getElementById('edit-phone').value = localStorage.getItem('memberPhoneStore1') || "";
    document.getElementById('edit-show-id').innerText = localStorage.getItem('memberIdStore1') || "ไม่มีรหัส";
    
    document.getElementById('edit-profile-modal').style.display = 'flex';
}

// 2. ฟังก์ชันปิดป๊อปอัป (กรณีกดยกเลิก)
function closeEditModal() {
    document.getElementById('edit-profile-modal').style.display = 'none';
}

// 3. ฟังก์ชันกดเซฟข้อมูล
function saveEditedProfile() {
    let newNickname = document.getElementById('edit-nickname').value.trim();
    let newPhone = document.getElementById('edit-phone').value.trim();

    if (newNickname === "") {
        alert("กรุณากรอกชื่อเล่นด้วยครับ");
        return;
    }

    let phoneRegex = /^0[689]\d{8}$/; 
    if (!phoneRegex.test(newPhone)) {
        alert("เบอร์โทรศัพท์ไม่ถูกต้องครับ!\n- ต้องขึ้นต้นด้วย 06, 08, หรือ 09\n- ต้องครบ 10 หลัก");
        return;
    }

    // เซฟทับของเก่า
    localStorage.setItem('memberNicknameStore1', newNickname);
    localStorage.setItem('memberPhoneStore1', newPhone);

    closeEditModal();

    // อัปเดตหน้าจอทันที
    if (typeof updateProfilePageData === 'function') {
        updateProfilePageData();
    }

    alert("อัปเดตข้อมูลเรียบร้อยแล้ว!");
}
// ==========================================
// ส่วนแก้ไขข้อมูลโปรไฟล์ จบตรงนี้
// ==========================================

// ==========================================
// สั่งปิดป๊อปอัปเมื่อคลิกพื้นที่สีดำ (นอกกล่องขาว)
// ==========================================
window.onclick = function(event) {
    let editModal = document.getElementById('edit-profile-modal');
    
    // ถ้าจุดที่นิ้วจิ้มลงไปคือตัวพื้นหลังสีดำ (editModal) ให้สั่งปิดทันที
    if (event.target === editModal) {
        closeEditModal();
    }
}
// ==========================================
// สั่งปิดป๊อปอัปทันที เมื่อลูกค้ากดแถบเมนูหลักสลับหน้า
// ==========================================
let bottomMenu = document.getElementById('bottom-nav-store1') || document.querySelector('.bottom-nav-store1') || document.querySelector('nav');

if (bottomMenu) {
    bottomMenu.addEventListener('click', function() {
        closeEditModal(); // สั่งพับกล่องแก้ไข
    });
}
// ==========================================
// สั่งปิดป๊อปอัปเมื่อคลิกพื้นที่สีดำ (นอกกล่องขาว)จบตรงนี้
// ==========================================

// ฟังก์ชันคำนวณชิ้นและราคารวม ส่งไปโชว์ที่ปุ่มตะกร้าสีส้ม
function updateCartSummary() {
    let displayItems = 0;
    let displayPrice = 0;

    // คำนวณจากของในตะกร้า (อิงจากตัวแปร cartItemsStore1 ของนาย)
    if (typeof cartItemsStore1 !== 'undefined') {
        displayItems = cartItemsStore1.reduce((sum, item) => sum + (item.qty || 0), 0);
        displayPrice = cartItemsStore1.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);
    }

    // เอาตัวเลขที่บวกเสร็จแล้วไปแปะใน index.html
    let countEl = document.getElementById('cart-count-store1');
    let priceEl = document.getElementById('cart-total-price-store1');
    
    if (countEl) countEl.innerText = `🛒 ${displayItems} ชิ้น`;
    if (priceEl) priceEl.innerText = `฿${displayPrice}`;
}

// เริ่มใหม่ตรงนี้

// ฟังก์ชันเปิดหน้าตะกร้าย่อย
// ฟังก์ชันกวาดซ่อนทุกอย่างให้หน้าจอโล่งๆ
function hideAllPages() {
    let mainPage = document.getElementById('main-page-store1');
    if (mainPage) mainPage.style.display = 'none';

    let subPage = document.getElementById('sub-category-page-store1');
    if (subPage) subPage.style.display = 'none';

    let cartPage = document.getElementById('cart-page-store1');
    if (cartPage) cartPage.style.display = 'none';

    // ซ่อนแถบหัวเว็บสีน้ำเงินตัวปัญหา
    let header = document.getElementById('main-header-store1');
    if (header) header.style.display = 'none';
}

// 1. โค้ดเปิดหน้าตะกร้า (ซ่อนท่อนบนทั้งหมดให้หน้าบิลโล่งๆ)
function openCartPage() {
    let mainPage = document.getElementById('main-page-store1');
    if (mainPage) mainPage.style.display = 'none';
    
    let subPage = document.getElementById('sub-category-page-store1');
    if (subPage) subPage.style.display = 'none';
    
    let profilePage = document.getElementById('profile-page-store1');
    if (profilePage) profilePage.style.display = 'none';

    // ท่าไม้ตาย: ซ่อนก้อนด้านบนทั้งหมด (แถบน้ำเงิน, ช่องค้นหา, เมนู, ตะกร้าส้ม) ไปพักก่อน!
    let stickyTop = document.querySelector('.sticky-top-section');
    if (stickyTop) stickyTop.style.display = 'none';

    // เปิดเฉพาะหน้าตะกร้าบิล
    let cartPage = document.getElementById('cart-page-store1');
    if (cartPage) cartPage.style.display = 'block';

    renderCart(); // เรียกฟังก์ชันจัดเรียงสินค้า
}

function renderCart() {
    let list = document.getElementById('cart-items-list-store1');
    let totalDisplay = document.getElementById('final-total-price-store1');
    let container = document.getElementById('new-cart-container-store1'); 
    let emptyMsg = document.getElementById('empty-cart-msg-store1'); 

    if (cartItemsStore1.length === 0) {
        if (container) container.style.display = 'none'; 
        if (emptyMsg) emptyMsg.style.display = 'block';  
    } else {
        if (container) container.style.display = 'block'; 
        if (emptyMsg) emptyMsg.style.display = 'none';    
        
        let html = '';
        let totalPrice = 0;
        
        cartItemsStore1.forEach(item => {
            let itemTotal = (item.price || 0) * (item.qty || 0);
            totalPrice += itemTotal;
            
            // ดักจับรูปภาพ ให้รองรับทั้งชื่อเก่าและชื่อใหม่
            let showImg = item.imageUrl || item.img || ''; 
            
            html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px dashed #eee; font-size: 14px;">
                <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                    <img src="${showImg}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                    <div>
                        <div style="font-weight: bold; color: #333;">${item.name}</div>
                        <div style="color: #ff4b2b; font-weight: bold; margin-top: 5px;">฿${itemTotal}</div>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px; background: #f9fafb; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <button onclick="updateCartItemQty('${item.id}', -1)" style="width: 28px; height: 28px; background: #fff; border: 1px solid #ef4444; border-radius: 6px; font-weight: bold; color: #ef4444; cursor: pointer;">-</button>
                    <span style="font-weight: bold; width: 22px; text-align: center;">${item.qty}</span>
                    <button onclick="updateCartItemQty('${item.id}', 1)" style="width: 28px; height: 28px; background: #1e3a8a; border: none; border-radius: 6px; font-weight: bold; color: white; cursor: pointer;">+</button>
                </div>
            </div>`;
        });
        
        html += `<div style="display: flex; justify-content: space-between; padding: 15px 0; font-weight: bold;">🚚 ค่าจัดส่ง: รอคำนวณ</div>`;
        if (list) list.innerHTML = html;
        if (totalDisplay) totalDisplay.innerText = `฿${totalPrice}`;
    }
}


// 2. ฟังก์ชันสมองกล จัดการปุ่ม + และ - ในหน้าตะกร้า (อัปเดตให้อ่าน ID 100%)
function updateCartItemQty(itemId, change) {
    // 🔥 หาสินค้าตัวที่โดนกดว่าอยู่ตำแหน่งไหนในตะกร้า โดยเช็คจาก ID
    let itemIndex = cartItemsStore1.findIndex(i => i.id === itemId);
    
    if (itemIndex > -1) {
        // คำนวณเลขล่วงหน้าว่าถ้ากดแล้วจะเหลือเท่าไหร่
        let newQty = cartItemsStore1[itemIndex].qty + change;
        
        // ดึงชื่อมาเก็บไว้เผื่อเด้งป๊อปอัปถามตอนลบเท่านั้น
        let itemNameForAlert = cartItemsStore1[itemIndex].name;
        
        // ถ้ายุบลงไปเหลือ 0 (หรือติดลบ)
        if (newQty <= 0) {
            // เด้งป๊อปอัปถามลูกค้าก่อน
            if (confirm(`ต้องการลบ "${itemNameForAlert}" ออกจากตะกร้าใช่ไหม?`)) {
                cartItemsStore1.splice(itemIndex, 1); // กดตกลง = ลบทิ้ง
            } else {
                cartItemsStore1[itemIndex].qty = 1; // กดยกเลิก = ดึงกลับมาคาไว้ที่ 1 ชิ้นเหมือนเดิม
            }
        } else {
            // ถ้าเลขยังมากกว่า 0 ก็อัปเดตปกติ
            cartItemsStore1[itemIndex].qty = newQty;
        }
        
        // สั่งให้อัปเดตปุ่มตะกร้าสีส้มด้านบน
        if (typeof updateCartSummary === 'function') {
            updateCartSummary();
        }
        
        // สั่งให้วาดบิลตะกร้าใหม่อีกรอบ เพื่อโชว์เลขล่าสุด
        renderCart();
    }
}


// 3. โค้ดปุ่มลบบิล
function clearCart() {
    if (confirm('ต้องการลบบิลนี้ทิ้งทั้งหมดใช่ไหม?')) {
        cartItemsStore1 = []; 
        if (typeof updateCartSummary === 'function') updateCartSummary(); 
        
        // ปิดหน้าตะกร้า
        document.getElementById('cart-page-store1').style.display = 'none';
        
        // คืนชีพท่อนบน และกลับไปหน้าหลัก
        let stickyTop = document.querySelector('.sticky-top-section');
        if (stickyTop) stickyTop.style.display = 'block';
        
        let mainPage = document.getElementById('main-page-store1');
        if (mainPage) mainPage.style.display = 'block';

        // 🔥 เพิ่มคำสั่งปลุกแถบค้นหาให้กลับมาโชว์
        let searchSec = document.querySelector('.search-section');
        if (searchSec) searchSec.style.display = 'block';
    }
}

// 4. โค้ดยืนยันคำสั่งซื้อ
// โค้ดยืนยันคำสั่งซื้อ (อัปเดตการเรียงข้อความบิลใหม่ + จำลองส่งข้อมูลหลังบ้าน)
function confirmOrder() {
    if (cartItemsStore1.length === 0) {
        alert('ตะกร้าว่างอยู่ เลือกสินค้าก่อนนะ!');
        return;
    }

    let nickname = localStorage.getItem('memberNicknameStore1') || "ไม่ระบุชื่อ";
    let memberId = localStorage.getItem('memberIdStore1') || "GUEST";
    
    // 1. สร้างรหัสบิล (ไอดีสมาชิก + วันเดือนปี DDMMYY + สุ่มอักษร 6 ตัว)
    let d = new Date();
    let dd = d.getDate().toString().padStart(2, '0');
    let mm = (d.getMonth() + 1).toString().padStart(2, '0');
    let yy = d.getFullYear().toString().slice(-2);
    let dateCode = dd + mm + yy; 
    let uniqueCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    let billId = `${memberId}-${dateCode}-${uniqueCode}`; 
    
    let totalPrice = cartItemsStore1.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);

    // 2. ประกอบข้อความบิลเรียงตามลำดับใหม่
    let msg = `👤 ชื่อลูกค้า: ${nickname}\n`;
    msg += `🆔 รหัสบิล ${billId}\n\n`;
    msg += `--------------------------\n`;
    msg += `🛒 *รายการสั่งซื้อสินค้า*\n\n`;
    
    cartItemsStore1.forEach(item => {
        msg += `• ${item.name} (x${item.qty}) = ฿${(item.price || 0) * (item.qty || 0)}\n`;
    });
    
    msg += `--------------------------\n`;
    msg += `💰 *ยอดรวมสินค้ารวมทั้งสิ้น ฿${totalPrice}*\n`;
    msg += `(รอคำนวณค่าจัดส่งตามระยะทางจริง)\n\n`;
    msg += `--------------------------\n`;
    msg += `กด "ส่ง" เพื่อแจ้งรายการสั่งซื้อกับทางร้านได้เลยจ้า`;

    // 🚀 [ทำหลังบ้านแล้วต้องมาแก้โค้ดบล็อกนี้] 🚀
    // จำลองเซฟข้อมูลลง Database เพื่อเอาไปทำหลังบ้านแบบพับ/กางได้
    let orderData = {
        billId: billId,
        memberId: memberId,
        customerName: nickname,
        items: JSON.parse(JSON.stringify(cartItemsStore1)), 
        productTotal: totalPrice, 
        shippingCost: 0, 
        finalTotal: totalPrice, 
        status: "รอสรุปยอด",
        timestamp: d.getTime()
    };
    
    // บันทึกจำลองลงเครื่องไว้ก่อน
    let mockDB = JSON.parse(localStorage.getItem('mockOrdersDB_store1')) || [];
    mockDB.push(orderData);
    localStorage.setItem('mockOrdersDB_store1', JSON.stringify(mockDB));
    // ----------------------------------------------------

    // 3. ส่งเข้า LINE OA ด้วยลิงก์ของร้าน
    let lineUrl = `https://line.me/R/oaMessage/@160pwewf/?${encodeURIComponent(msg)}`;
    window.open(lineUrl, '_blank');

    // 4. ล้างตะกร้าและกลับหน้าหลัก
    cartItemsStore1 = [];
    if (typeof updateCartSummary === 'function') updateCartSummary();
    if (typeof renderCart === 'function') renderCart();
    
    document.getElementById('cart-page-store1').style.display = 'none';
    let stickyTop = document.querySelector('.sticky-top-section');
    if (stickyTop) stickyTop.style.display = 'block';
    let mainPage = document.getElementById('main-page-store1');
    if (mainPage) mainPage.style.display = 'block';

    // 🔥 เพิ่มคำสั่งปลุกแถบค้นหาให้กลับมาโชว์
    let searchSec = document.querySelector('.search-section');
    if (searchSec) searchSec.style.display = 'block';
}


// 5. โค้ดดักจับตอนกดเมนูด้านล่าง (อัปเดตใหม่ ไม่กวนหน้าโปรไฟล์)
document.addEventListener("DOMContentLoaded", function() {
    let bottomNav = document.getElementById('bottom-nav-store1') || document.querySelector('nav') || document.querySelector('.bottom-nav') || document.querySelector('.bottom-menu');
    
    if (bottomNav) {
        bottomNav.addEventListener('click', function() {
            // หน่วงเวลาแป๊บนึง 50 มิลลิวินาที ให้ระบบสลับหน้าของนายทำงานให้เสร็จก่อน
            setTimeout(function() {
                let stickyTop = document.querySelector('.sticky-top-section');
                let mainPage = document.getElementById('main-page-store1');
                
                // เช็คว่าตอนนี้กลับมา "หน้าหลัก" (โชว์หมวดหมู่) ใช่ไหม?
                if (mainPage && mainPage.style.display === 'block') {
                    // ถ้าใช่ ค่อยโชว์ก้อนด้านบน (แถบน้ำเงิน ช่องค้นหา)
                    if (stickyTop) stickyTop.style.display = 'block';
                } else {
                    // ถ้าไม่ใช่ (เช่น กำลังอยู่หน้าโปรไฟล์) สั่งซ่อนทิ้งไปเลย!
                    if (stickyTop) stickyTop.style.display = 'none';
                }
            }, 50);
        });
    }
});



// ==========================================
// โค้ดดักจับตอนกดเมนูด้านล่าง (แก้บัคบิลทะลุหน้าอื่น)
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    // หาแถบเมนูด้านล่าง (เผื่อชื่อ Class หรือ ID ไว้หลายแบบ)
    let bottomNav = document.getElementById('bottom-nav-store1') || document.querySelector('nav') || document.querySelector('.bottom-nav') || document.querySelector('.bottom-menu');
    
    if (bottomNav) {
        bottomNav.addEventListener('click', function() {
            // 1. เมื่อกดสลับหน้า ให้ซ่อนหน้าตะกร้าบิลทิ้งไปเลย
            let cartPage = document.getElementById('cart-page-store1');
            if (cartPage) cartPage.style.display = 'none';
            
            // 2. เรียกปุ่มตะกร้าสีส้มกลับมาให้กดใหม่ได้
            let cartSummary = document.getElementById('cart-summary-store1');
            if (cartSummary) cartSummary.style.display = 'block';
            
            // 3. คืนชีพแถบสีน้ำเงินด้วย (เผื่อติดบัค)
            let header = document.getElementById('main-header-store1');
            if (header) header.style.display = 'block';
        });
    }
});

// =========================================
// สั่งซ่อน/โชว์ปุ่มเมนูล่างตามแป้นพิมพ์ (อัปเดตใหม่ แก้เมนูลอยและลบช่องโหว่)
// =========================================
if (window.visualViewport) {
    const initialHeight = window.visualViewport.height;
    
    window.visualViewport.addEventListener('resize', () => {
        const bottomMenu = document.getElementById('bottom-nav-store1'); 
        
        // ถ้าหน้าจอเตี้ยลงกว่าตอนแรก 100px (แปลว่าแป้นพิมพ์เด้งขึ้นมา)
        if (window.visualViewport.height < initialHeight - 100) {
            if (bottomMenu) bottomMenu.style.display = 'none'; // ซ่อนเมนู
            document.body.style.paddingBottom = '0px'; // ลบช่องโหว่สีขาวด้านล่างทิ้ง
        } else {
            // แป้นพิมพ์พับเก็บแล้ว
            if (bottomMenu) bottomMenu.style.display = 'flex'; // โชว์เมนูกลับมา
            document.body.style.paddingBottom = '100px'; // คืนค่าพื้นที่ดันเมนูให้เท่าเดิม
        }
    });
}

/////////////////////////////////////////////
//. แถบค้นค้าสินค้ารวมทุกหมวดหมู่ .//
/////////////////////////////////////////////

function searchProducts() {
    let keyword = document.getElementById('searchInput').value.toLowerCase();
    let container = document.getElementById('search-results-container');
    
    if (keyword === "") {
        container.innerHTML = "";
        return;
    }

    let allProducts = [];
    Object.values(products).forEach(catItems => {
        allProducts = allProducts.concat(catItems);
    });

    let filtered = allProducts.filter(item => item.name.toLowerCase().includes(keyword));

    if (filtered.length > 0) {
        let html = `<h4 style="margin-bottom:10px;">พบ ${filtered.length} รายการ</h4>`;
        filtered.forEach(item => {
            // 🔥 ดักจับรูปภาพ ให้รองรับทั้งชื่อเก่าและชื่อใหม่
            let showImg = item.imageUrl || item.img || ''; 
            
            html += `
            <div class="search-result-item" onclick="addFromSearch('${item.id}')" style="cursor: pointer; background: #fff; padding: 10px; margin-bottom: 8px; border-radius: 10px; border: 1px solid #eee; display: flex; align-items: center; gap: 10px;">
                <img src="${showImg}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px;">
                <div style="flex:1;">${item.name}</div>
                <div style="color:#ff4b2b; font-weight:bold;">฿${item.price}</div>
            </div>`;
        });
        container.innerHTML = html;
    } else {
        container.innerHTML = `<p style="text-align:center; color:gray;">ไม่พบสินค้าที่ค้นหา</p>`;
    }
}


/////////////////////////////////////////////
//. แถบค้นค้าสินค้ารวมทุกหมวดหมู่(จบตรงนี้) .//
/////////////////////////////////////////////

////////////////////////////////////////////
//. ฟังชั่นต่อจากค้นค้าสินค้าและเลือกจำนวนชิ้นสินค้าก่อนโยนไปตะกร้าสินค้า (อัปเกรดคำนวณราคา) .//
/////////////////////////////////////////////

let selectedProduct = null;
let currentModalQty = 1;

function addFromSearch(productId) {
    let foundProduct = null;
    Object.values(products).forEach(catItems => {
        let item = catItems.find(p => p.id === productId);
        if (item) foundProduct = item;
    });

    if (foundProduct) {
        selectedProduct = foundProduct;
        currentModalQty = 1; 
        
        let searchImgBox = document.getElementById('modal-product-icon');
        
        // 🔥 แก้ตรงนี้: ดึงรูปภาพให้ถูกต้อง ไม่ว่าจะถูกบันทึกมาด้วยชื่ออะไร
        let finalImg = foundProduct.imageUrl || foundProduct.img;
        
        if (finalImg && finalImg !== "📦") {
            searchImgBox.innerHTML = `<img src="${finalImg}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
        } else {
            searchImgBox.innerHTML = "📦";
        }
        
        document.getElementById('modal-product-name').innerText = foundProduct.name;
        document.getElementById('modal-product-price').innerText = foundProduct.price; 
        document.getElementById('modal-qty-display').innerText = currentModalQty;
        document.getElementById('modal-total-price').innerText = foundProduct.price;

        document.getElementById('product-selector-modal').style.display = 'flex';
    }
}

function updateModalQty(change) {
    currentModalQty += change;
    if (currentModalQty < 1) currentModalQty = 1; // ห้ามต่ำกว่า 1
    document.getElementById('modal-qty-display').innerText = currentModalQty;
    
    // คำนวณราคารวมสดๆ ตอนกดปุ่ม + หรือ -
    if (selectedProduct) {
        let totalPrice = selectedProduct.price * currentModalQty;
        document.getElementById('modal-total-price').innerText = totalPrice;
    }
}

function confirmAddToCart() {
    if (selectedProduct) {
        // เพิ่มลงตะกร้า
        let existingItem = cartItemsStore1.find(i => i.id === selectedProduct.id);
        if (existingItem) {
            existingItem.qty += currentModalQty;
        } else {
            let newItem = JSON.parse(JSON.stringify(selectedProduct)); // คัดลอกข้อมูล
            newItem.qty = currentModalQty;
            cartItemsStore1.push(newItem);
        }
        
        // จบงาน
        if (typeof updateCartSummary === 'function') updateCartSummary();
        closeProductModal();
        alert(`เพิ่ม "${selectedProduct.name}" ${currentModalQty} ชิ้นเรียบร้อย!`);
    }
}

function closeProductModal() {
    document.getElementById('product-selector-modal').style.display = 'none';
}


/////////////////////////////////////////////
//. ฟังชั่นต่อจากค้นค้าสินค้าและเลือกจำนวนชิ้นสินค้าก่อนโยนไปตะกร้าสินค้า(จบตรงนี้) .//
/////////////////////////////////////////////

// =========================================
// กดพื้นที่ว่างข้างนอกป๊อปอัปค้นหาสินค้า เพื่อพับหน้าต่างสินค้า
// =========================================
window.addEventListener('click', function(event) {
    let productModal = document.getElementById('product-selector-modal');
    // ถ้าจุดที่นิ้วจิ้มลงไปคือตัวฉากหลังของป๊อปอัป (ไม่ใช่กล่องเนื้อหาสีขาว) ให้ปิดทันที
    if (event.target === productModal) {
        closeProductModal();
    }
});
// =========================================
// // กดพื้นที่ว่างข้างนอกป๊อปอัปค้นหาสินค้า เพื่อพับหน้าต่างสินค้า (จบจรงนี้)
// =========================================
