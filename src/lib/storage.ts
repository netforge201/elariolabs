export async function uploadFile(file: File) {
  const apiKey = process.env.IMGBB_API_KEY;
  
  if (!apiKey) {
    throw new Error('API ключ ImgBB не найден. Добавьте IMGBB_API_KEY в переменные окружения.');
  }

  const formData = new FormData();
  formData.append('image', file);

  // Отправляем картинку напрямую в облако ImgBB
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Ошибка при загрузке изображения в облако');
  }

  // Возвращаем данные в том формате, который ожидает ваш API и база данных
  return {
    filename: result.data.image.filename,
    mimeType: file.type,
    size: file.size,
    url: result.data.url, // ⬅️ Теперь здесь будет вечная ссылка на облако
  };
}