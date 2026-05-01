import zipfile
import os

def zip_directory(folder_path, zip_path):
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                # Create relative path for the file in zip
                rel_path = os.path.relpath(file_path, folder_path)
                zipf.write(file_path, rel_path)

if __name__ == "__main__":
    extension_dir = r"c:\Users\Dell\Documents\phishEye\Project\Extension"
    output_zip = r"c:\Users\Dell\Documents\phishEye\Project\FrontEnd\PhishEye-Extension.zip"
    
    print(f"Zipping {extension_dir} to {output_zip}...")
    zip_directory(extension_dir, output_zip)
    print("Done!")
