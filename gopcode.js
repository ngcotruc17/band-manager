const fs = require('fs');
const path = require('path');

const rootDir = __dirname; 
const outputFile = 'toan_bo_code.txt';

// Danh sách các thư mục rác/nặng tuyệt đối KHÔNG ĐƯỢC gộp
const ignoreDirs = ['node_modules', '.git', 'build', 'dist', 'public'];

// Danh sách các đuôi file cần lấy
const allowedExtensions = ['.js', '.jsx', '.css', '.json', '.env', '.md'];

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        const filePath = path.join(currentDirPath, name);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            if (!ignoreDirs.includes(name)) {
                walkSync(filePath, callback);
            }
        }
    });
}

let combinedContent = '';

walkSync(rootDir, function(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // Bỏ qua file package-lock.json vì nó chứa code hệ thống rất dài, không có tác dụng tối ưu
    if (fileName === 'package-lock.json' || fileName === 'gopcode.js' || fileName === outputFile) return;
    
    if (allowedExtensions.includes(ext) || fileName === '.env') {
        const relativePath = path.relative(rootDir, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        combinedContent += `\n\n========================================\n`;
        combinedContent += `==== File: ${relativePath} ====\n`;
        combinedContent += `========================================\n\n`;
        combinedContent += content;
    }
});

fs.writeFileSync(outputFile, combinedContent, 'utf8');
console.log(`✅ Đã gộp xong! Hãy tìm file có tên là: ${outputFile} và gửi lên đây nhé.`);