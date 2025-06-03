// בחירת כל התמונות בגלריה
const images = document.querySelectorAll('.gallery-grid img');
const popup = document.getElementById('popup');
const popupImg = document.getElementById('popup-img');
const closeBtn = document.querySelector('.close');

// בלחיצה על תמונה - תוצג במודל
images.forEach(img => {
  img.addEventListener('click', () => {
    popup.style.display = 'flex';
    popupImg.src = img.src;
    popupImg.alt = img.alt;
  });
});

// סגירת המודל בלחיצה על ה-X
closeBtn.addEventListener('click', () => {
  popup.style.display = 'none';
});

// סגירה גם בלחיצה מחוץ לתמונה
popup.addEventListener('click', (e) => {
  if (e.target === popup) {
    popup.style.display = 'none';
  }
});

images.forEach(img => {
  img.addEventListener('click', (e) => {
    if (e.isTrusted) { // רק אם זו פעולה של המשתמש
      popup.style.display = 'flex';
      popupImg.src = img.src;
      popupImg.alt = img.alt;
    }
  });
});
