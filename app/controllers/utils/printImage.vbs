
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    strFile = "D:\F.LIE\MyProject\BackEndProject\general-pos-be\app\controllers\utils\output\output-1.png"
    Set objShell = CreateObject("Shell.Application")
    Set objFolder = objFSO.GetParentFolderName(strFile)
    Set objFolderItem = objShell.Namespace(objFolder).ParseName(objFSO.GetFileName(strFile))
    objFolderItem.InvokeVerb("Print")
  