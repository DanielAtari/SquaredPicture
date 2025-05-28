let currentBox = null;
let cropper = null;

function triggerUpload(box) {
  currentBox = box;
  document.getElementById('image-upload').click();
}

document.getElementById('image-upload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  openCropper(file);
  event.target.value = '';
});

function openCropper(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const image = document.getElementById('cropper-image');
    image.src = e.target.result;
    document.getElementById('cropper-modal').style.display = 'flex';
    if (cropper) cropper.destroy();
    cropper = new Cropper(image, {
      aspectRatio: 1,
      viewMode: 1,
    });
  };
  reader.readAsDataURL(file);
}

function cropImage() {
  if (!cropper || !currentBox) return;
  const canvas = cropper.getCroppedCanvas({ width: 500, height: 500 });
  const img = document.createElement('img');
  img.src = canvas.toDataURL();
  currentBox.innerHTML = '';
  currentBox.appendChild(img);

  // הוספת כפתור מחיקה אחרי התמונה
  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerText = '×';
  deleteBtn.onclick = function(e) { deleteImage(e, deleteBtn); };
  currentBox.appendChild(deleteBtn);

  closeCropper();
}

function closeCropper() {
  document.getElementById('cropper-modal').style.display = 'none';
  if (cropper) cropper.destroy();
  cropper = null;
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
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    currentBox = box;
    openCropper(file);
  }
}
