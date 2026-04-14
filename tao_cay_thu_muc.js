const fs = require('fs');
const path = require('path');

const outputFile = 'CayThuMuc_FiveM.txt';

// Các thư mục không cần đưa vào danh sách để tránh rác file
const ignoredFolders = ['node_modules', '.git', 'dist'];

function generateTree(dir, prefix = '') {
    let treeString = '';
    let files;

    try {
        files = fs.readdirSync(dir);
    } catch (err) {
        return treeString;
    }

    // Lọc bỏ các thư mục không cần thiết và file sinh ra từ script này
    const filteredFiles = files.filter(file => 
        !ignoredFolders.includes(file) && 
        file !== 'tao_cay_thu_muc.js' && 
        file !== outputFile &&
        file !== 'gop_code.js' && 
        file !== 'ToanBoCode_FiveM.txt'
    );

    filteredFiles.forEach((file, index) => {
        const fullPath = path.join(dir, file);
        const isLast = index === filteredFiles.length - 1;
        const marker = isLast ? '└── ' : '├── ';
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            treeString += `${prefix}${marker}📂 [${file}]\n`;
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            treeString += generateTree(fullPath, newPrefix);
        } else {
            treeString += `${prefix}${marker}📄 ${file}\n`;
        }
    });

    return treeString;
}

try {
    console.log('⏳ Đang phân tích cấu trúc thư mục...');
    const rootName = path.basename(__dirname);
    let finalOutput = `📁 ${rootName} (Thư mục gốc)\n` + generateTree(__dirname);
    
    fs.writeFileSync(outputFile, finalOutput, 'utf-8');
    console.log(`✅ Thành công! Đã xuất sơ đồ cây ra file: ${outputFile}`);
} catch (error) {
    console.error('❌ Có lỗi xảy ra:', error);
}