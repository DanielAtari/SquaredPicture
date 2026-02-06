console.log("📦 order.js loaded");

let currentBox = null;
let cropper = null;

// 🚧 דגל פיתוח - שנה ל-false לפני העלאה לפרודקשן!
const DEV_MODE = false;
console.log("🚧 DEV_MODE is:", DEV_MODE);

// טעינת תמונות שמורות מ-sessionStorage (אם חוזרים מדף אישור)
document.addEventListener('DOMContentLoaded', loadSavedImages);

function loadSavedImages() {
  try {
    const savedImages = JSON.parse(sessionStorage.getItem("uploadedImages"));
    if (!savedImages || savedImages.length === 0) return;
    
    console.log("🔄 Loading saved images:", savedImages.length);
    
    const uploadBoxes = document.querySelectorAll('.upload-box');
    
    savedImages.forEach((imgSrc, index) => {
      if (index < uploadBoxes.length && imgSrc) {
        const box = uploadBoxes[index];
        
        // יצירת תמונה
        const img = document.createElement('img');
        img.src = imgSrc;
        
        // ניקוי התיבה והוספת התמונה
        box.innerHTML = '';
        box.appendChild(img);
        
        // הוספת כפתור מחיקה
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerText = '×';
        deleteBtn.onclick = function(e) { deleteImage(e, deleteBtn); };
        box.appendChild(deleteBtn);
      }
    });
    
    console.log("✅ Saved images loaded successfully");
  } catch (e) {
    console.log("⚠️ No saved images to load or error:", e);
  }
}

// תור של קבצים להעלאה מרובה
let fileQueue = [];
let currentFileIndex = 0;

function triggerUpload(box) {
  currentBox = box;
  // בדיקה אם יש כבר תמונה - אם כן, פתח cropper לעריכה
  const existingImg = box.querySelector('img');
  if (existingImg) {
    openCropperWithDataUrl(existingImg.src);
  } else {
    document.getElementById('image-upload').click();
  }
}

// העלאה מרובה - פתיחת דיאלוג לבחירת מספר תמונות
function triggerMultiUpload() {
  document.getElementById('multi-upload').click();
}

// טיפול בהעלאת תמונה בודדת
document.getElementById('image-upload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  openCropper(file);
  event.target.value = '';
});

// טיפול בהעלאה מרובה
document.getElementById('multi-upload')?.addEventListener('change', function(event) {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;
  
  // מציאת כל התיבות הריקות
  const emptyBoxes = Array.from(document.querySelectorAll('.upload-box')).filter(box => !box.querySelector('img'));
  
  // הגבלה למספר התיבות הריקות
  const filesToProcess = files.slice(0, emptyBoxes.length);
  
  if (filesToProcess.length === 0) {
    alert('אין מקום פנוי לתמונות נוספות');
    return;
  }
  
  if (files.length > emptyBoxes.length) {
    alert(`נבחרו ${files.length} תמונות, אבל יש רק ${emptyBoxes.length} מקומות פנויים. יועלו ${filesToProcess.length} תמונות.`);
  }
  
  // שמירת התור והתחלת עיבוד
  fileQueue = filesToProcess.map((file, index) => ({
    file: file,
    targetBox: emptyBoxes[index]
  }));
  currentFileIndex = 0;
  
  processNextInQueue();
  event.target.value = '';
});

// עיבוד הקובץ הבא בתור
function processNextInQueue() {
  if (currentFileIndex >= fileQueue.length) {
    fileQueue = [];
    currentFileIndex = 0;
    return;
  }
  
  const item = fileQueue[currentFileIndex];
  currentBox = item.targetBox;
  openCropper(item.file);
}

// פתיחת cropper עם קובץ
function openCropper(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    openCropperWithDataUrl(e.target.result);
  };
  reader.readAsDataURL(file);
}

// פתיחת cropper עם data URL (לעריכה מחדש)
function openCropperWithDataUrl(dataUrl) {
  const image = document.getElementById('cropper-image');
  image.src = dataUrl;
  document.getElementById('cropper-modal').style.display = 'flex';
  
  // עדכון מונה וכפתור דילוג
  const counter = document.getElementById('cropper-counter');
  const skipBtn = document.getElementById('skip-btn');
  
  if (fileQueue.length > 1) {
    counter.textContent = `תמונה ${currentFileIndex + 1} מתוך ${fileQueue.length}`;
    counter.style.display = 'block';
    skipBtn.style.display = 'inline-block';
  } else {
    counter.style.display = 'none';
    skipBtn.style.display = 'none';
  }
  
  if (cropper) cropper.destroy();
  cropper = new Cropper(image, {
    aspectRatio: 1,
    viewMode: 1,
  });
}

function cropImage() {
  if (!cropper || !currentBox) return;
  const canvas = cropper.getCroppedCanvas({ width: 1080, height: 1080 });
  const img = document.createElement('img');
  // שמירת גרסה באיכות גבוהה להעלאה ל-Cloudinary
  var hiRes = canvas.toDataURL('image/jpeg', 0.92);
  img.src = hiRes;
  img.dataset.hires = hiRes; // שמירת הגרסה האיכותית ב-data attribute
  currentBox.innerHTML = '';
  currentBox.appendChild(img);

  // הוספת כפתור מחיקה אחרי התמונה
  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerText = '×';
  deleteBtn.onclick = function(e) { deleteImage(e, deleteBtn); };
  currentBox.appendChild(deleteBtn);

  closeCropper();
  
  // המשך לקובץ הבא בתור (אם יש)
  currentFileIndex++;
  if (fileQueue.length > 0) {
    setTimeout(processNextInQueue, 300);
  }
}

function closeCropper() {
  document.getElementById('cropper-modal').style.display = 'none';
  if (cropper) cropper.destroy();
  cropper = null;
}

// דילוג על תמונה בתור
function skipCurrent() {
  closeCropper();
  currentFileIndex++;
  if (fileQueue.length > 0) {
    setTimeout(processNextInQueue, 100);
  }
}

function deleteImage(event, btn) {
  event.stopPropagation();
  const box = btn.parentElement;
  box.innerHTML = '+';
  box.appendChild(btn); // משאיר את כפתור המחיקה ל־hover
}

function allowDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleDrop(event, box) {
  event.preventDefault();
  box.classList.remove('drag-over');
  
  const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  
  if (files.length === 1) {
    // תמונה בודדת - התנהגות רגילה
    currentBox = box;
    openCropper(files[0]);
  } else if (files.length > 1) {
    // מספר תמונות - התפרסות אוטומטית
    const allBoxes = Array.from(document.querySelectorAll('.upload-box'));
    const startIndex = allBoxes.indexOf(box);
    const emptyBoxes = allBoxes.slice(startIndex).filter(b => !b.querySelector('img'));
    
    const filesToProcess = files.slice(0, emptyBoxes.length);
    
    fileQueue = filesToProcess.map((file, index) => ({
      file: file,
      targetBox: emptyBoxes[index]
    }));
    currentFileIndex = 0;
    
    processNextInQueue();
  }
}

async function handlePreview() {
  console.log("🔍 handlePreview called");
  console.log("🚧 DEV_MODE:", DEV_MODE);
  
  const imageElements = document.querySelectorAll('.upload-box img');
  const hiResImages = [];
  const previewImages = [];

  imageElements.forEach(img => {
    if (img.src && !img.src.includes('placeholder')) {
      // Use high-res version from data attribute if available, otherwise use src
      hiResImages.push(img.dataset.hires || img.src);
      previewImages.push(img.src);
    }
  });

  console.log("📷 Found images:", hiResImages.length);

  // 🚧 במצב פיתוח - דילוג על בדיקת 9 תמונות
  if (!DEV_MODE && hiResImages.length !== 9) {
    alert("חובה להעלות בדיוק 9 תמונות לצורך ההזמנה.");
    return;
  }
  
  if (hiResImages.length === 0) {
    alert("לא נבחרו תמונות. העלה לפחות תמונה אחת.");
    return;
  }

  // 🔄 שמירה: גרסה דחוסה ל-sessionStorage (תצוגה מקדימה) + גרסה איכותית להעלאה
  console.log("🔄 Preparing images for storage...");
  
  try {
    // גרסה דחוסה לתצוגה מקדימה (קטנה - מתאימה ל-sessionStorage)
    const compressedImages = await Promise.all(previewImages.map(img => compressImage(img, 400)));
    console.log("✅ Preview images compressed");
    
    // ניקוי ושמירה - תצוגה מקדימה
    sessionStorage.removeItem("uploadedImages");
    sessionStorage.setItem("uploadedImages", JSON.stringify(compressedImages));

    // שמירת גרסאות באיכות גבוהה להעלאה ל-Cloudinary
    sessionStorage.removeItem("uploadedImagesHiRes");
    sessionStorage.setItem("uploadedImagesHiRes", JSON.stringify(hiResImages));
    
    // בדיקה שהשמירה הצליחה
    const verification = sessionStorage.getItem("uploadedImages");
    const savedCount = verification ? JSON.parse(verification).length : 0;
    console.log("✅ Verification - saved", savedCount, "images");
    
    if (savedCount !== hiResImages.length) {
      throw new Error("Image count mismatch after save");
    }
    
    // ✅ עבור לעמוד הבא
    console.log("➡️ Redirecting to confirm.html");
    window.location.href = "confirm.html";
    
  } catch (e) {
    console.error("❌ Storage error:", e);
    alert("שגיאה בשמירת התמונות: " + e.message);
  }
}

// דחיסת תמונה לגודל קטן יותר (לשמירה ב-sessionStorage)
function compressImage(base64, maxSize = 350) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // תמיד מקטינים לגודל קבוע (ריבוע)
        canvas.width = maxSize;
        canvas.height = maxSize;
        
        ctx.drawImage(img, 0, 0, maxSize, maxSize);
        
        // JPEG באיכות 60% - מספיק לתצוגה מקדימה
        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        console.log(`📦 Compressed: ${Math.round(base64.length/1024)}KB → ${Math.round(compressed.length/1024)}KB`);
        resolve(compressed);
      } catch (e) {
        reject(e);
      }
    };
    
    img.onerror = function() {
      reject(new Error("Failed to load image"));
    };
    
    img.src = base64;
  });
}
