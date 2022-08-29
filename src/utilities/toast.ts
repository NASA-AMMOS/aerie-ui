import Toastify from 'toastify-js';

export function showFailureToast(text: string): void {
  const toast = Toastify({
    backgroundColor: '#a32a2a',
    className: 'st-typography-body',
    duration: 3000,
    gravity: 'bottom',
    position: 'left',
    text,
  });
  toast.showToast();
}

export function showSuccessToast(text: string): void {
  const toast = Toastify({
    backgroundColor: '#2da44e',
    className: 'st-typography-body',
    duration: 3000,
    gravity: 'bottom',
    position: 'left',
    text,
  });
  toast.showToast();
}
