
    $printerName = (Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default = TRUE").Name
    Start-Process -FilePath "D:\F.LIE\MyProject\BackEndProject\general-pos-be\app\controllers\utils\output\output-1.png" -ArgumentList "/p" -NoNewWindow
  