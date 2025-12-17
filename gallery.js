// פונקציה לאתחול הגלריה
function initGallery() {
  const images = document.querySelectorAll('.gallery-grid img');
  const popup = document.getElementById('popup');
  const popupImg = document.getElementById('popup-img');
  const closeBtn = document.querySelector('.close');

  if (!images.length || !popup) return;

  // בלחיצה על תמונה - תוצג במודל
  images.forEach(img => {
    img.addEventListener('click', () => {
      popup.style.display = 'flex';
      popupImg.src = img.src;
      popupImg.alt = img.alt;
    });
  });

  // סגירת המודל בלחיצה על ה-X
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      popup.style.display = 'none';
    });
  }

  // סגירה גם בלחיצה מחוץ לתמונה
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.style.display = 'none';
    }
  });
}

// אתחול בטעינת הדף
document.addEventListener('DOMContentLoaded', initGallery);

// חשיפת הפונקציה לשימוש גלובלי (עבור Router)
window.initGallery = initGallery;
