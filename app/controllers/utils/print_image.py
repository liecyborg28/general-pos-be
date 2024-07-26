import win32con
import win32print
import win32ui
from PIL import Image
import sys
import os

def print_image(image_path):
    # Verifikasi jalur file
    if not os.path.isfile(image_path):
        print(f"File gambar tidak ditemukan: {image_path}")
        return

    print(f"Mencetak gambar: {image_path}")
    
    # Open the image file
    image = Image.open(image_path)
    printer_name = win32print.GetDefaultPrinter()

    # Create a device context
    hDC = win32ui.CreateDC()
    hDC.CreatePrinterDC(printer_name)
    hDC.StartDoc(image_path)
    hDC.StartPage()

    # Load the image into a bitmap
    dib = win32ui.CreateBitmap()
    dib.CreateCompatibleBitmap(hDC, image.width, image.height)
    dib_info = dib.GetInfo()
    dib_dc = hDC.CreateCompatibleDC()
    dib_dc.SelectObject(dib)

    dib_dc.DrawBitmap(image.tobytes(), (0, 0, dib_info['bmWidth'], dib_info['bmHeight']))

    hDC.BitBlt((0, 0), (image.width, image.height), dib_dc, (0, 0), win32con.SRCCOPY)

    hDC.EndPage()
    hDC.EndDoc()
    hDC.DeleteDC()

    # Hapus file gambar setelah pencetakan selesai
    try:
        os.remove(image_path)
        print(f"File gambar dihapus: {image_path}")
    except Exception as e:
        print(f"Gagal menghapus file gambar: {e}")

if __name__ == "__main__":
    print(f"Jalur file gambar dari argumen: {sys.argv[1]}")
    print_image(sys.argv[1])
