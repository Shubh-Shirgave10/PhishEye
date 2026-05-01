import os
import zipfile

def zip_dir(path, zip_handler):
    for root, dirs, files in os.walk(path):
        for file in files:
            # Create a relative path for the file in the zip
            rel_path = os.path.relpath(os.path.join(root, file), os.path.dirname(path))
            zip_handler.write(os.path.join(root, file), rel_path)

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
extension_dir = os.path.join(project_root, 'Extension')
output_zip = os.path.join(project_root, 'FrontEnd', 'PhishEye-Extension.zip')

print(f"Zipping {extension_dir} to {output_zip}...")
with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zip_file:
    zip_dir(extension_dir, zip_file)

print("Done!")
