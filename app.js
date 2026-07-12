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

    loadMemberOrderHistory(); //..(แทรกตรงนี้ใช่มั้ย..

}

// ==========================================
// 📌 1. ระบบรหัสลับ (สร้างกล่องเอง + แก้บั๊กทับหน้าโปรไฟล์)
// ==========================================
let isVipMode = false; // ตัวแปรจำว่าตอนนี้เปิดราคาส่งอยู่หรือเปล่า (เดี๋ยวสเต็ปหน้าเราค่อยเปลี่ยนให้มันจำใน Firebase)

function toggleMerchantCode() {
    let codeBox = document.getElementById('merchant-code-toggle');
    
    // ถ้าเป็นราคาส่งอยู่แล้ว กดอีกทีเพื่อปิด (สวิตช์ชั่วคราว ไว้เทสก่อนผูกระบบหลังบ้าน)
    if (isVipMode) {
        isVipMode = false;
        codeBox.innerText = "******";
        codeBox.style.color = "red";
        alert("กลับสู่ราคาปลีกปกติ");
        
        // 🔴 เช็คก่อนว่าเปิดหน้าสินค้าย่อยอยู่รึเปล่า ค่อยรีเฟรชสินค้า
        let subPage = document.getElementById('sub-category-page-store1');
        if (subPage && subPage.style.display === 'block') {
            if (typeof currentCategoryStore1 !== 'undefined' && currentCategoryStore1) {
                openCategory(currentCategoryStore1);
            }
        }
        return;
    }

    // 🚨 สร้างป๊อปอัปกรอกรหัสขึ้นมาเอง
    let overlay = document.createElement('div');
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:99999; display:flex; justify-content:center; align-items:center;";
    
    let box = document.createElement('div');
    box.style.cssText = "background:white; padding:25px; border-radius:15px; text-align:center; width:80%; max-width:320px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);";
    
    let title = document.createElement('h3');
    title.innerText = "ยืนยันสิทธิ์"; // เปลี่ยนคำไม่ให้ลูกค้าทั่วไปรู้แล้ว
    title.style.cssText = "margin-top:0; color:#16365d;";
    
    let input = document.createElement('input');
    input.type = "password";
    input.placeholder = "พิมพ์รหัสลับ...";
input.style.cssText = "width:100%; padding:12px; margin-bottom:20px; border:1px solid #ccc; border-radius:8px; box-sizing:border-box; text-align:center; font-size:1.2em; letter-spacing:3px; user-select:text; -webkit-user-select:text;";    
    let btnBox = document.createElement('div');
    btnBox.style.display = "flex";
    btnBox.style.gap = "10px";
    
    let btnCancel = document.createElement('button');
    btnCancel.innerText = "ยกเลิก";
    btnCancel.style.cssText = "flex:1; padding:12px; border:none; background:#e0e0e0; border-radius:8px; cursor:pointer; font-weight:bold;";
    
    let btnConfirm = document.createElement('button');
    btnConfirm.innerText = "ตกลง";
    btnConfirm.style.cssText = "flex:1; padding:12px; border:none; background:#16365d; color:white; border-radius:8px; cursor:pointer; font-weight:bold;";
    
    btnBox.appendChild(btnCancel);
    btnBox.appendChild(btnConfirm);
    box.appendChild(title);
    box.appendChild(input);
    box.appendChild(btnBox);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

   // setTimeout(() => input.focus(), 100);

    btnCancel.onclick = () => {
        document.body.removeChild(overlay);
    };

btnConfirm.onclick = async () => {
        let enteredPin = input.value.trim();
        document.body.removeChild(overlay); 
        
        if (!enteredPin) return;

        try {
            const vipDoc = await db.collection("admins").doc("vip_code").get();
            if (vipDoc.exists && vipDoc.data().pin === enteredPin) {
                isVipMode = true;
                codeBox.innerText = "✅ ราคาส่ง";
                codeBox.style.color = "green";
                
                // 🔥 ลอจิกใหม่: สั่งบันทึกสิทธิ์ VIP ขึ้น Firebase ถาวร
                let memberId = localStorage.getItem('memberIdStore1');
                if (memberId) {
                    await db.collection("users").doc(memberId).update({ 
                        vipStatus: true 
                    });
                }
                
                // 🔴 เช็คก่อนว่าเปิดหน้าสินค้าย่อยอยู่รึเปล่า ถ้าใช่อยู่ค่อยรีเฟรชสินค้า
                let subPage = document.getElementById('sub-category-page-store1');
                if (subPage && subPage.style.display === 'block') {
                    if (typeof currentCategoryStore1 !== 'undefined' && currentCategoryStore1) {
                        openCategory(currentCategoryStore1);
                    }
                }
            } 
        } catch (error) {
            console.error("Error checking VIP code:", error);
        }
    };
} // 🌟 กูใส่ปีกกาปิดฟังก์ชันตัวนี้ให้แล้ว วางทับของเดิมรอยแดงหายทันที!
// ==========================================
// (จบตรงนี้)📌 1. ระบบรหัสลับ (สร้างกล่องเอง + แก้บั๊กทับหน้าโปรไฟล์) (จบตรงนี้)
// ==========================================

// ==========================================
// 📌 2. ฟังก์ชันโชว์สินค้า (ปรับให้รองรับสลับราคา ปลีก/ส่ง)
// ==========================================
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
            let finalImg = p.imageUrl || p.img;
            let imgHtml = "";
            
            if (finalImg && finalImg !== "📦") {
                imgHtml = `<img src="${finalImg}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
            } else {
                imgHtml = `<div style="background: #f0f0f0; color: #333; font-size: 30px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 8px;">📦</div>`;
            }

            // 🔥 ลอจิกเช็คราคา: ถ้าใส่รหัสลับผ่านแล้ว (isVipMode เป็น true) ให้ดึงราคาส่ง ถ้าไม่ใช่ดึงราคาปลีก
            let displayPrice = isVipMode ? p.wholesale : p.price;
            // ไฮไลท์สีราคาให้รู้ด้วย: ถ้าราคาส่งให้เป็นสีเขียว ถ้าปลีกให้สีส้มแดงปกติ
            let priceColor = isVipMode ? "#28a745" : "#ff4b2b";

            htmlStr += `
            <div onclick="openModal('${p.id}')" style="background: white; border-radius: 15px; padding: 15px 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer;">
                <div id="prod-img-box" style="width: 100%; height: 70px; margin-bottom: 10px;">
                    ${imgHtml}
                </div>
                <h3 style="font-size: 14px; margin: 0 0 5px 0; color: #333;">${p.name}</h3>
                <p style="color: ${priceColor}; font-weight: bold; margin: 0; font-size: 16px;">฿${displayPrice}</p>
            </div>
            `;
        }
        productContainer.innerHTML = htmlStr;
    } else {
        productContainer.style.display = 'block'; 
        productContainer.innerHTML = "<p style='text-align:center; color:#999; margin-top: 20px;'>กำลังอัปเดตสินค้าจ้า...</p>";
    }
}
// ==========================================
// (จบตรงนี้)📌 2. ฟังก์ชันโชว์สินค้า (ปรับให้รองรับสลับราคา ปลีก/ส่ง) (จบตรงนี้)
// ==========================================

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
// ส่วนที่ 4: ระบบควบคุมป๊อปอัป (อัปเกรดรองรับราคาส่ง VIP)
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
    
    // 🔥 ดักจับรูปภาพ
    let finalImg = currentProduct.imageUrl || currentProduct.img; 

    if (finalImg && finalImg !== "📦") {
        modalImg.innerHTML = `<img src="${finalImg}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
    } else {
        modalImg.innerHTML = "📦";
    }
    
    // 🔴 เลือกว่าจะใช้ราคาไหน (ถ้าใส่รหัสผ่านแล้ว ให้ใช้ราคาส่ง ถ้าไม่ใช่ใช้ราคาปลีก)
    let activePrice = isVipMode ? currentProduct.wholesale : currentProduct.price;

    document.getElementById('modal-name-store1').innerText = currentProduct.name;
    document.getElementById('modal-price-unit-store1').innerText = `฿${activePrice} / ชิ้น`; // แสดงราคาที่ถูกต้อง
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
    // 🔴 คำนวณยอดรวม ต้องเช็คด้วยว่าตอนนี้ใช้ราคาไหนอยู่
    let activePrice = isVipMode ? currentProduct.wholesale : currentProduct.price;
    let total = activePrice * currentQty;
    document.getElementById('modal-confirm-btn').innerText = `ตกลง (รวม ฿${total})`;
}

function confirmSelection() {
    if (!currentProduct) return;

    // 🔴 เตรียมราคาที่จะโยนลงตะกร้าให้ถูกต้องตามสถานะ VIP
    let activePrice = isVipMode ? currentProduct.wholesale : currentProduct.price;

    let existingItem = cartItemsStore1.find(item => item.id === currentProduct.id);
    
    if (existingItem) {
        existingItem.qty += currentQty;
        // กรณีลูกค้าเผลอกดใส่ตะกร้าตอนเป็นราคาปลีก แล้วเพิ่งมาใส่รหัส VIP ทีหลัง เราต้องอัปเดตราคาในตะกร้าให้ด้วย
        existingItem.price = activePrice; 
    } else {
        cartItemsStore1.push({
            id: currentProduct.id, 
            name: currentProduct.name,
            price: activePrice, // 🔥 โยนราคาที่ถูกต้อง (ปลีก/ส่ง) ลงตะกร้า
            img: currentProduct.imageUrl || currentProduct.img || '',
            qty: currentQty
        });
    }

    if (typeof updateCartSummary === 'function') {
        updateCartSummary();
    }
    
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

    // 🔥 [จุดที่กูเพิ่มให้] สั่งให้จำรูปลงตู้เซฟของมือถือทันที!
    localStorage.setItem('mySavedProfileImage', croppedImageBase64);

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
// โค้ดยืนยันคำสั่งซื้อ (อัปเดตการเรียงข้อความบิลใหม่ + ส่งข้อมูลเข้า Firebase)
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

    // 🚀 [อัปเดตแล้ว!] ส่งข้อมูลบิลไปเก็บบน Firebase (แฟ้มชื่อ orders)
    let orderData = {
        billId: billId,
        memberId: memberId,
        customerName: nickname,
        items: JSON.parse(JSON.stringify(cartItemsStore1)), 
        productTotal: totalPrice, 
        shippingCost: 0, 
        finalTotal: totalPrice, 
        status: "รอสรุปยอด", // สถานะเริ่มต้นเพื่อให้หลังบ้านดึงไปโชว์ห้องแรก
        timestamp: d.getTime(), // เวลาที่สั่งซื้อ เอาไว้เรียงลำดับบิลเก่า-ใหม่
        dateString: d.toLocaleDateString('th-TH') // เก็บวันที่แบบอ่านง่ายไว้ด้วย
    };
    
    // สั่งบันทึกข้อมูลลง Firebase
    db.collection("orders").doc(billId).set(orderData)
    .then(() => {
        console.log("✅ บันทึกบิลลง Firebase สำเร็จ บิลหมายเลข: ", billId);
    })
    .catch((error) => {
        console.error("❌ เกิดข้อผิดพลาดในการบันทึกบิล: ", error);
    });

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
    let keywordInput = document.getElementById('searchInput');
    if (!keywordInput) return; // ดักเผื่อหาช่องพิมพ์ไม่เจอ จะได้ไม่เออเร่อ
    
    let keyword = keywordInput.value.trim().toLowerCase();
    let container = document.getElementById('search-results-container');
    if (!container) return;

    if (keyword === "") {
        container.innerHTML = "";
        return;
    }

    let allProducts = [];
    
    // 🔴 [ด่านป้องกัน 1]: ดักจับกรณี hiddenCategories ไม่ถูกประกาศไว้ จะได้ไม่ช็อต
    let hiddenCats = typeof hiddenCategories !== 'undefined' ? hiddenCategories : [];
    
    Object.entries(products).forEach(([catName, catItems]) => {
        if (!hiddenCats.includes(catName)) {
            allProducts = allProducts.concat(catItems);
        }
    });

    // 🔥 [ด่านค้นหา]: แก้ตามที่ตี๋เคยขอ เปลี่ยนเป็น .startsWith ค้นหาเฉพาะ "คำขึ้นต้น" เท่านั้น!
    let filtered = allProducts.filter(item => {
        if (!item.name) return false;
        return item.name.trim().toLowerCase().startsWith(keyword);
    });

    if (filtered.length > 0) {
        let html = `<h4 style="margin-bottom:10px;">พบ ${filtered.length} รายการ</h4>`;
        filtered.forEach(item => {
            let showImg = item.imageUrl || item.img || ''; 
            
            // 🔴 [ด่านป้องกัน 2]: ดักจับ isVipMode ป้องกันการช็อตเวลาตัวแปรหลุด
            let currentVipStatus = typeof isVipMode !== 'undefined' ? isVipMode : false;
            
            // ดึงราคา ปลีก/ส่ง ตามสถานะ VIP (ถ้าไม่มีราคาส่งให้สลับไปใช้ราคาปลีกแทนกันเหนียว)
            let displayPrice = currentVipStatus ? (item.wholesale || item.price) : item.price;
            let priceColor = currentVipStatus ? "#28a745" : "#ff4b2b"; // เขียว=ส่ง, ส้ม=ปลีก
            
            html += `
            <div class="search-result-item" onclick="addFromSearch('${item.id}')" style="cursor: pointer; background: #fff; padding: 10px; margin-bottom: 8px; border-radius: 10px; border: 1px solid #eee; display: flex; align-items: center; gap: 10px;">
                <img src="${showImg}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px;">
                <div style="flex:1;">${item.name}</div>
                <div style="color:${priceColor}; font-weight:bold;">฿${displayPrice}</div>
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
        let finalImg = foundProduct.imageUrl || foundProduct.img;
        
        if (finalImg && finalImg !== "📦") {
            searchImgBox.innerHTML = `<img src="${finalImg}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
        } else {
            searchImgBox.innerHTML = "📦";
        }
        
        // 🔴 ป้องกันตัวแปรหลุด
        let currentVipStatus = typeof isVipMode !== 'undefined' ? isVipMode : false;
        let activePrice = currentVipStatus ? (foundProduct.wholesale || foundProduct.price) : foundProduct.price;
        
        document.getElementById('modal-product-name').innerText = foundProduct.name;
        document.getElementById('modal-product-price').innerText = activePrice; 
        document.getElementById('modal-qty-display').innerText = currentModalQty;
        document.getElementById('modal-total-price').innerText = activePrice;

        document.getElementById('product-selector-modal').style.display = 'flex';
    }
}

function updateModalQty(change) {
    currentModalQty += change;
    if (currentModalQty < 1) currentModalQty = 1; // ห้ามต่ำกว่า 1
    document.getElementById('modal-qty-display').innerText = currentModalQty;
    
    // คำนวณราคารวมสดๆ ตอนกดปุ่ม + หรือ -
    if (selectedProduct) {
        let currentVipStatus = typeof isVipMode !== 'undefined' ? isVipMode : false;
        let activePrice = currentVipStatus ? (selectedProduct.wholesale || selectedProduct.price) : selectedProduct.price;
        
        let totalPrice = activePrice * currentModalQty;
        document.getElementById('modal-total-price').innerText = totalPrice;
    }
}

function confirmAddToCart() {
    if (selectedProduct) {
        // 🔴 เตรียมราคาที่จะโยนลงตะกร้า
        let currentVipStatus = typeof isVipMode !== 'undefined' ? isVipMode : false;
        let activePrice = currentVipStatus ? (selectedProduct.wholesale || selectedProduct.price) : selectedProduct.price;

        let existingItem = cartItemsStore1.find(i => i.id === selectedProduct.id);
        if (existingItem) {
            existingItem.qty += currentModalQty;
            existingItem.price = activePrice; // อัปเดตราคาในตะกร้าให้ด้วย
        } else {
            let newItem = JSON.parse(JSON.stringify(selectedProduct)); // คัดลอกข้อมูลกันเหนียว
            newItem.qty = currentModalQty;
            newItem.price = activePrice; 
            cartItemsStore1.push(newItem);
        }
        
        if (typeof updateCartSummary === 'function') updateCartSummary();
        
        // สั่งปิดป๊อปอัป (อันนี้ต้องเก็บไว้ ห้ามลบ)
        closeProductModal(); 
        
        // ❌ บรรทัด alert แจ้งเตือน กูลบทิ้งไปให้แล้วจากตรงนี้! มือถือจะได้ไม่ค้าง
    }
}

// ❌ ห้ามลบฟังก์ชันนี้เด็ดขาด มันคือตัวสั่งปิดป๊อปอัป!
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

// ==========================================
// 📌 ระบบสวิตช์ เปิด/ปิด หมวดหมู่สินค้าหน้าบ้าน (ส่วนที่ 2: ฝั่งหน้าบ้านรับคำสั่ง)
// ==========================================
let hiddenCategories = []; // 🔥 [เพิ่มตัวแปร] สมุดจดบัญชีดำ เก็บชื่อหมวดหมู่ที่โดนปิด

async function loadCategoryVisibility() {
    try {
        const snapshot = await db.collection("categoryStatus").get();
        hiddenCategories = []; // ล้างค่าก่อนทุกครั้งที่โหลดใหม่
        
        snapshot.forEach(doc => {
            const catName = doc.id; 
            const data = doc.data();

            const categoryCard = document.querySelector(`div[onclick*="'${catName}'"]`);
            
            if (data.isShowing === false) {
                hiddenCategories.push(catName); // 🔥 จดชื่อหมวดหมู่ที่โดนปิดลงบัญชีดำ!
                if (categoryCard) categoryCard.style.display = 'none'; 
            } else {
                if (categoryCard) categoryCard.style.display = ''; 
            }
        });
        console.log("✅ โหลดสถานะ ซ่อน/โชว์ หมวดหมู่หน้าบ้านสำเร็จ!");
    } catch (error) {
        console.error("❌ โหลดสถานะหมวดหมู่หน้าบ้านไม่สำเร็จ: ", error);
    }
}

// สั่งให้ระบบเช็ค ซ่อน/โชว์ ทันทีที่ลูกค้าเปิดเว็บหน้าบ้านขึ้นมา
window.addEventListener('DOMContentLoaded', loadCategoryVisibility);
// ==========================================
// 📌 ระบบสวิตช์ เปิด/ปิด หมวดหมู่สินค้าหน้าบ้าน (จบตรงนี้)
// ==========================================

// ==========================================
// 📌 ฟังก์ชันดึงรูปโปรไฟล์ที่เคยเซฟไว้ มาแสดงตอนเปิดแอป
// ==========================================
function loadSavedProfileImage() {
    let savedImg = localStorage.getItem('mySavedProfileImage');
    
    if (savedImg) {
        // ถ้าเจอรูปในตู้เซฟ ให้เอามาใส่ตัวแปรหลัก
        croppedImageBase64 = savedImg;

        // 1. อัปเดตรูปมุมซ้ายบน (หน้าหลัก)
        const avatarIcon = document.getElementById('header-avatar-img-store1');
        if (avatarIcon) {
            avatarIcon.innerHTML = '';
            avatarIcon.style.backgroundImage = `url('${croppedImageBase64}')`;
            avatarIcon.style.backgroundSize = 'cover';
            avatarIcon.style.backgroundPosition = 'center';
        }
        
        const avatarBox = document.querySelector('#main-header-store1 .avatar-box');
        if (avatarBox) {
            avatarBox.onclick = openBigProfileModal;
        }

        // 2. อัปเดตรูปหน้าโปรไฟล์ย่อย
        let profileSubAvatar = document.getElementById('profile-page-avatar');
        let profileSubPlaceholder = document.getElementById('profile-page-placeholder');
        if (profileSubAvatar && profileSubPlaceholder) {
            profileSubAvatar.src = croppedImageBase64;
            profileSubAvatar.style.display = 'block'; 
            profileSubPlaceholder.style.display = 'none'; 
        }
    }
}

// สั่งให้ระบบวิ่งไปดึงรูปทันทีที่ลูกค้าเปิดแอป
window.addEventListener('DOMContentLoaded', loadSavedProfileImage);
// ==========================================
// 📌 ฟังก์ชันดึงรูปโปรไฟล์ที่เคยเซฟไว้ มาแสดงตอนเปิดแอป(จบตรงนี้)
// ==========================================


// ==========================================
// 📌 ระบบดึงประวัติการสั่งซื้อของลูกค้า (เวอร์ชันล็อกเวลาตรงกับหลังบ้าน 100% + แก้ไขปุ่มไม่กาง)
// ==========================================
function loadMemberOrderHistory() {
    const container = document.getElementById('member-order-history-container');
    if (!container) return;

    // 1. ดึงไอดีลูกค้าจากเครื่อง
    const memberId = localStorage.getItem('memberIdStore1');
    if (!memberId || memberId === "GUEST") {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">(กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ)</div>';
        return;
    }

    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">กำลังโหลดประวัติการสั่งซื้อ... ⏳</div>';

    // 2. วิ่งไปดึงบิลจาก Firebase เฉพาะที่เป็นของลูกค้ารายนี้เท่านั้น
    db.collection("orders").where("memberId", "==", memberId).get()
    .then((querySnapshot) => {
        let orders = [];
        
        // 3. กรองเอาเฉพาะ "ชำระแล้ว" กับ "ยกเลิก"
        querySnapshot.forEach(doc => {
            let order = doc.data();
            if (order.status === "ชำrateแล้ว" || order.status === "ชำระแล้ว" || order.status === "ยกเลิก") {
                order.docId = doc.id;
                orders.push(order);
            }
        });

        if (orders.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">(ยังไม่มีประวัติการสั่งซื้อที่สำเร็จหรือยกเลิก)</div>';
            return;
        }

        // 4. เรียงลำดับตามเวลาอัปเดตล่าสุด (updatedAt) หรือเวลาสั่งซื้อล่าสุด (timestamp) ดันขึ้นบนสุด
        orders.sort((a, b) => {
            let timeA = a.updatedAt ? (a.updatedAt.toMillis ? a.updatedAt.toMillis() : a.updatedAt) : (a.timestamp || 0);
            let timeB = b.updatedAt ? (b.updatedAt.toMillis ? b.updatedAt.toMillis() : b.updatedAt) : (b.timestamp || 0);
            return timeB - timeA;
        });

        let html = '';
        
        // 5. วนลูปวาดการ์ดบิลทีละใบโดยจำลองพิมพ์เขียวหลังบ้านมาเป๊ะๆ
        orders.forEach((order, index) => {
            let isPaid = (order.status === "ชำระแล้ว" || order.status === "ชำrateแล้ว");
            
            // เซ็ตระบบสีคุมโทนแยกห้องตามค่านิยมหลังบ้านเป๊ะๆ
            let mainColor = isPaid ? "#28a745" : "#dc3545"; 
            let headBg = isPaid ? "#e8f5e9" : "#fdf2f2";
            let headBorder = isPaid ? "#c8e6c9" : "#f5c6cb";
            let stampText = isPaid ? "✅ ชำระเงินแล้ว" : "❌ บิลยกเลิก";
            let stampBg = isPaid ? "rgba(40, 167, 69, 0.05)" : "rgba(220, 53, 69, 0.05)";
            let subtitleText = isPaid ? "หลักฐานการชำระเงิน (Proof of Payment)" : "บิลนี้ถูกยกเลิก (Cancelled Bill)";
            
            // ป้ายแคปซูลบนขวา โชว์คำว่า ชำระแล้ว / บิลยกเลิก
            let badgeText = isPaid ? "ชำระแล้ว" : "บิลยกเลิก";

            // 🔥 [จุดแก้ไขหลัก!] ดึงเวลาจาก updatedAt ของหลังบ้านมาแปลงโชว์หน้าบ้าน เพื่อให้เวลาตรงกัน 100%
            let finalDate = new Date();
            if (order.updatedAt) {
                finalDate = order.updatedAt.toDate ? order.updatedAt.toDate() : new Date(order.updatedAt);
            } else if (order.timestamp) {
                finalDate = new Date(order.timestamp);
            }
            
            let dateFormatted = finalDate.toLocaleDateString('th-TH');
            let timeFormatted = finalDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            
            let detailsId = `history-details-${order.billId}`;

            // วนลูปดึงรายการสินค้าด้านในบิล
            let itemsHtml = '';
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    let imgUrl = item.imageUrl || item.img || item.image || 'https://cdn-icons-png.flaticon.com/512/1170/1170628.png'; 
                    let quantity = item.qty || item.quantity || 1;
                    
                    itemsHtml += `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #eee;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <img src="${imgUrl}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
                                <div>
                                    <div style="font-weight: bold; color: #333; font-size: 0.95em;">${item.name || 'สินค้า'}</div>
                                    <div style="color: #666; font-size: 0.85em;">฿${item.price} x ${quantity}</div>
                                </div>
                            </div>
                            <div style="font-weight: bold; color: #333;">฿${(item.price * quantity)}</div>
                        </div>
                    `;
                });
            }

            let shippingCost = order.shippingCost || 0;
            let productTotal = order.productTotal || 0;
            let finalTotal = productTotal + shippingCost;

            // ประกอบร่างโครงสร้างตัวบิลสไตล์หลังบ้าน 2 บรรทัดแบบพับกางกะทัดรัด
            html += `
                <div class="bill-card" style="margin-bottom: 15px; border: 1px solid ${mainColor}; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    
                    <div onclick="toggleOrderHistory('${detailsId}')" style="background: ${headBg}; padding: 12px 15px; cursor: pointer; border-bottom: 1px solid ${headBorder};">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-weight: bold; color: ${mainColor}; font-size: 1.05em;">บิล: ${orders.length - index}</span>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-weight: bold; color: #333;">คุณ ${order.customerName}</span>
                                <span style="background: ${mainColor}; color: white; padding: 3px 10px; border-radius: 20px; font-size: 0.8em; font-weight: bold; display: inline-block;">${badgeText}</span>
                            </div>
                        </div>
                        
                        <div style="color: #666; font-size: 0.85em; font-weight: bold; text-align: left;">
                            รหัสบิล: <span style="color: #555; font-weight: normal;">${order.billId || order.docId}</span>
                        </div>
                    </div>

                    <div id="${detailsId}" style="display: none; padding: 20px; background: #fff;">
                        
                        <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px dashed ${mainColor}; padding-bottom: 15px;">
                            <h3 style="margin: 0; color: #16365d; font-size: 1.25em; font-weight: bold;">MaLee Online</h3>
                            <p style="margin: 4px 0 0 0; color: ${isPaid ? '#3b5998' : '#dc3545'}; font-size: 0.9em; font-weight: bold;">${subtitleText}</p>
                            <p style="margin: 2px 0 0 0; color: #999; font-size: 0.8em;">วันที่: ${dateFormatted} | เวลา: ${timeFormatted} น.</p>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <div style="color: #888; font-size: 0.8em; margin-bottom: 8px; font-weight: bold; text-align: center;">สรุปรายการสั่งซื้อ</div>
                            ${itemsHtml}
                        </div>

                        <div style="background: #f9f9f9; padding: 12px; border-radius: 6px; border: 1px solid #eee; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9em;">
                                <span style="color: #666;">ยอดรวมสินค้า:</span>
                                <span style="color: #333; font-weight: bold;">฿${productTotal}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9em;">
                                <span style="color: #666;">ค่าจัดส่ง:</span>
                                <span style="color: #333; font-weight: bold;">฿${shippingCost}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 1.1em; font-weight: bold; border-top: 1px solid #eee; padding-top: 8px; margin-top: 4px;">
                                <span style="color: #16365d;">ยอดชำระสุทธิ:</span>
                                <span style="color: ${mainColor};">฿${finalTotal}</span>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: center; margin-top: 10px;">
                            <div style="border: 2px solid ${mainColor}; color: ${mainColor}; font-size: 0.9em; font-weight: bold; padding: 6px 16px; transform: rotate(-3deg); border-radius: 8px; background: ${stampBg};">
                                ${stampText}
                            </div>
                        </div>
                        
                    </div>

                </div>
            `;
        });

        container.innerHTML = html;
    })
    .catch((error) => {
        console.error("❌ โหลดประวัติพลาด: ", error);
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: red; font-size: 14px;">เกิดข้อผิดพลาดในการดึงข้อมูล</div>';
    });
}

// บังคับให้ฟังก์ชันสลับพับ/กางเป็นระดับ Global ทะลุทะลวงทุกปีกกาครอบ (ล็อกความเสถียร 100%)
window.toggleOrderHistory = function(detailsId) {
    let el = document.getElementById(detailsId);
    if (el) {
        if (el.style.display === 'none' || el.style.display === '') {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    }
}

//==============================================================================
//..เริ่มโค้ดฟังก์ชันที่ลบไปทั้งหมดด้านบนวางตรงนี้ลงไป
//==============================================================================
// ==========================================
// 1. ส่วนลงทะเบียนครั้งแรก (พร้อมเซฟลง Firebase)
// ==========================================
async function submitWelcomeData() {
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

    // เซฟลงเครื่อง
    localStorage.setItem('memberIdStore1', newMemberId);
    localStorage.setItem('memberNicknameStore1', nickname);
    localStorage.setItem('memberPhoneStore1', phone);

    // 🔥 เซฟขึ้น Firebase
    try {
        await db.collection("users").doc(newMemberId).set({
            memberId: newMemberId,
            name: nickname,
            phone: phone,
            vipStatus: false, // ค่าเริ่มต้นคือลูกค้าธรรมดา
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Firebase Error: ", error);
    }

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
// 2. ส่วนแก้ไขข้อมูลโปรไฟล์ (เปิด-ปิด ป๊อปอัป)
// ==========================================
function openEditProfileModal() {
    document.getElementById('edit-nickname').value = localStorage.getItem('memberNicknameStore1') || "";
    document.getElementById('edit-phone').value = localStorage.getItem('memberPhoneStore1') || "";
    document.getElementById('edit-show-id').innerText = localStorage.getItem('memberIdStore1') || "ไม่มีรหัส";
    document.getElementById('edit-profile-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-profile-modal').style.display = 'none';
}


// ==========================================
// 3. ส่วนเซฟข้อมูลโปรไฟล์ที่แก้ไข (พร้อมอัปเดตขึ้น Firebase)
// ==========================================
async function saveEditedProfile() {
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

    // เซฟทับลงเครื่อง
    localStorage.setItem('memberNicknameStore1', newNickname);
    localStorage.setItem('memberPhoneStore1', newPhone);

    // 🔥 อัปเดตข้อมูลบน Firebase ให้ตรงกัน
    let memberId = localStorage.getItem('memberIdStore1');
    if (memberId) {
        try {
            await db.collection("users").doc(memberId).update({
                name: newNickname,
                phone: newPhone
            });
        } catch (error) {
            console.error("Firebase Update Error: ", error);
        }
    }

    closeEditModal();

    if (typeof updateProfilePageData === 'function') {
        updateProfilePageData();
    }

    alert("อัปเดตข้อมูลเรียบร้อยแล้ว!");
}
//==============================================================================
//..เริ่มโค้ดฟังก์ชันที่ลบไปทั้งหมดด้านบนวางตรงนี้ลงไป (จบตรงนี้)
//==============================================================================
// ==========================================
// 1. ส่วนลงทะเบียนครั้งแรก (พร้อมเซฟลง Firebase) (จบตรงนี้)


// ==========================================
// 🔥 ระบบเช็ค VIP อัตโนมัติตอนลูกค้าเปิดเว็บ (ซ่อนอยู่หลังบ้าน)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    let memberId = localStorage.getItem('memberIdStore1');
    if (memberId) {
        try {
            let userDoc = await db.collection("users").doc(memberId).get();
            // ถ้าลูกค้าคนนี้เคยใส่รหัสผ่านไปแล้ว (vipStatus เป็น true)
            if (userDoc.exists && userDoc.data().vipStatus === true) {
                isVipMode = true; // สวิตช์เป็นราคาส่งทันทีตั้งแต่เว็บโหลด
                
                // เปลี่ยนปุ่มหน้าโปรไฟล์ให้เป็นสีเขียว
                let codeBox = document.getElementById('merchant-code-toggle');
                if(codeBox) {
                    codeBox.innerText = "✅ ราคาส่ง";
                    codeBox.style.color = "green";
                }
            }
        } catch (error) {
            console.error("Error auto-checking VIP: ", error);
        }
    }
});
// ==========================================
//(จบตรงนี้) 🔥 ระบบเช็ค VIP อัตโนมัติตอนลูกค้าเปิดเว็บ (ซ่อนอยู่หลังบ้าน) (จบตรงนี้)
// ==========================================

