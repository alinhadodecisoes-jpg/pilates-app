import { Capacitor } from '@capacitor/core';

export async function shareToWhatsApp(text: string, phone?: string) {
  const cleanPhone = phone?.replace(/\D/g, '');
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  if (Capacitor.isNativePlatform()) {
    window.open(url, '_system');
  } else {
    window.open(url, '_blank');
  }
}

export async function shareText(text: string, title?: string) {
  if (navigator.share) {
    await navigator.share({ title: title || 'DAIMACH', text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}
