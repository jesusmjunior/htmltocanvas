// HTML to Canvas Converter Module
class HTMLToCanvasConverter {
    constructor(config) {
        this.config = config;
        this.currentPreset = 'instagram_post';
        this.generatedCanvas = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPresets();
        this.loadTemplates();
    }

    setupEventListeners() {
        // Preset selector
        const presetSelect = document.getElementById('preset-select');
        if (presetSelect) {
            presetSelect.addEventListener('change', (e) => {
                this.currentPreset = e.target.value;
                this.applyPreset(this.currentPreset);
            });
        }

        // Template selector
        const templateSelect = document.getElementById('template-select');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                this.loadTemplate(e.target.value);
            });
        }

        // Generate button
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateCanvas());
        }

        // Download buttons
        const downloadPngBtn = document.getElementById('download-png-btn');
        if (downloadPngBtn) {
            downloadPngBtn.addEventListener('click', () => this.downloadImage('png'));
        }

        const downloadJpgBtn = document.getElementById('download-jpg-btn');
        if (downloadJpgBtn) {
            downloadJpgBtn.addEventListener('click', () => this.downloadImage('jpg'));
        }

        // Copy to clipboard button
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }

        // Custom size inputs
        const customInputs = ['width', 'height', 'scale'];
        customInputs.forEach(input => {
            const element = document.getElementById(`custom-${input}`);
            if (element) {
                element.addEventListener('input', () => this.updateCustomPreset());
            }
        });
    }

    loadPresets() {
        const presetSelect = document.getElementById('preset-select');
        if (!presetSelect) return;

        presetSelect.innerHTML = '';
        Object.keys(this.config.presets).forEach(key => {
            const preset = this.config.presets[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = preset.name;
            presetSelect.appendChild(option);
        });

        this.applyPreset(this.currentPreset);
    }

    loadTemplates() {
        const templateSelect = document.getElementById('template-select');
        if (!templateSelect) return;

        templateSelect.innerHTML = '<option value="">Selecione um template</option>';
        Object.keys(this.config.templates).forEach(key => {
            const template = this.config.templates[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = template.name;
            templateSelect.appendChild(option);
        });
    }

    applyPreset(presetKey) {
        const preset = this.config.presets[presetKey];
        if (!preset) return;

        // Update input values
        document.getElementById('custom-width').value = preset.width;
        document.getElementById('custom-height').value = preset.height;
        document.getElementById('custom-scale').value = preset.scale;
        document.getElementById('export-format').value = preset.format;

        // Show preset info
        const infoElement = document.getElementById('preset-info');
        if (infoElement) {
            infoElement.innerHTML = `
                <strong>${preset.name}</strong><br>
                Tamanho: ${preset.width}x${preset.height}px<br>
                Escala: ${preset.scale}x<br>
                Formato: ${preset.format.toUpperCase()}
            `;
        }
    }

    loadTemplate(templateKey) {
        const template = this.config.templates[templateKey];
        if (!template) return;

        document.getElementById('html-input').value = template.html;
        document.getElementById('css-input').value = template.css;
        document.getElementById('js-input').value = template.js;

        this.updatePreview();
    }

    updateCustomPreset() {
        if (this.currentPreset !== 'custom') {
            document.getElementById('preset-select').value = 'custom';
            this.currentPreset = 'custom';
        }

        const width = document.getElementById('custom-width').value;
        const height = document.getElementById('custom-height').value;
        const scale = document.getElementById('custom-scale').value;

        this.config.presets.custom.width = parseInt(width);
        this.config.presets.custom.height = parseInt(height);
        this.config.presets.custom.scale = parseFloat(scale);
    }

    updatePreview() {
        const html = document.getElementById('html-input').value;
        const css = document.getElementById('css-input').value;
        const js = document.getElementById('js-input').value;

        const previewFrame = document.getElementById('preview-frame');
        if (!previewFrame) return;

        const fullHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background: #f0f0f0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    ${css}
                </style>
            </head>
            <body>
                ${html}
                <script>
                    try {
                        ${js}
                    } catch (error) {
                        console.error('JavaScript Error:', error);
                    }
                </script>
            </body>
            </html>
        `;

        previewFrame.contentDocument.open();
        previewFrame.contentDocument.write(fullHTML);
        previewFrame.contentDocument.close();
    }

    async generateCanvas() {
        const html = document.getElementById('html-input').value;
        if (!html.trim()) {
            this.showMessage(this.config.error_messages.no_html, 'error');
            return;
        }

        const preset = this.config.presets[this.currentPreset];
        
        // Show loading
        this.showLoading(true);

        try {
            // Create temporary container
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = preset.width + 'px';
            tempContainer.style.height = preset.height + 'px';
            tempContainer.style.background = preset.background;
            
            // Add HTML and CSS
            const css = document.getElementById('css-input').value;
            tempContainer.innerHTML = `
                <style>${css}</style>
                ${html}
            `;
            
            document.body.appendChild(tempContainer);

            // Execute JavaScript
            const js = document.getElementById('js-input').value;
            if (js) {
                try {
                    eval(js);
                } catch (error) {
                    console.error('JavaScript execution error:', error);
                }
            }

            // Generate canvas
            const canvas = await html2canvas(tempContainer, {
                ...this.config.html2canvas_options,
                width: preset.width,
                height: preset.height,
                scale: preset.scale,
                backgroundColor: preset.background
            });

            this.generatedCanvas = canvas;
            
            // Display canvas
            const outputContainer = document.getElementById('canvas-output');
            outputContainer.innerHTML = '';
            
            // Create scaled version for display
            const displayCanvas = document.createElement('canvas');
            const ctx = displayCanvas.getContext('2d');
            const maxWidth = outputContainer.clientWidth - 40;
            const scale = Math.min(maxWidth / canvas.width, 1);
            
            displayCanvas.width = canvas.width * scale;
            displayCanvas.height = canvas.height * scale;
            ctx.scale(scale, scale);
            ctx.drawImage(canvas, 0, 0);
            
            outputContainer.appendChild(displayCanvas);
            
            // Remove temporary container
            document.body.removeChild(tempContainer);
            
            this.showLoading(false);
            this.showMessage('Imagem gerada com sucesso!', 'success');
            
            // Enable download buttons
            document.getElementById('download-section').style.display = 'block';
            
        } catch (error) {
            console.error('Canvas generation error:', error);
            this.showMessage(this.config.error_messages.generation_failed, 'error');
            this.showLoading(false);
        }
    }

    async downloadImage(format) {
        if (!this.generatedCanvas) {
            this.showMessage('Gere uma imagem primeiro!', 'error');
            return;
        }

        try {
            const preset = this.config.presets[this.currentPreset];
            const formatConfig = this.config.export_formats[format];
            
            let dataURL;
            if (format === 'jpg') {
                // Create canvas with white background for JPG
                const jpgCanvas = document.createElement('canvas');
                const ctx = jpgCanvas.getContext('2d');
                jpgCanvas.width = this.generatedCanvas.width;
                jpgCanvas.height = this.generatedCanvas.height;
                
                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
                
                // Draw image
                ctx.drawImage(this.generatedCanvas, 0, 0);
                
                dataURL = jpgCanvas.toDataURL(formatConfig.mime, formatConfig.quality);
            } else {
                dataURL = this.generatedCanvas.toDataURL(formatConfig.mime, formatConfig.quality);
            }
            
            // Download
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `export-${Date.now()}${formatConfig.extension}`;
            link.click();
            
            this.showMessage('Download iniciado!', 'success');
            
        } catch (error) {
            console.error('Download error:', error);
            this.showMessage(this.config.error_messages.download_failed, 'error');
        }
    }

    async copyToClipboard() {
        if (!this.generatedCanvas) {
            this.showMessage('Gere uma imagem primeiro!', 'error');
            return;
        }

        try {
            this.generatedCanvas.toBlob(async (blob) => {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                this.showMessage('Imagem copiada para área de transferência!', 'success');
            });
        } catch (error) {
            console.error('Clipboard error:', error);
            this.showMessage(this.config.error_messages.clipboard_failed, 'error');
        }
    }

    showMessage(text, type = 'info') {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3'
        };

        message.style.backgroundColor = colors[type] || colors.info;
        document.body.appendChild(message);

        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load configuration
        const response = await fetch('config.json');
        const config = await response.json();
        
        // Initialize converter
        window.htmlToCanvasConverter = new HTMLToCanvasConverter(config);
        
    } catch (error) {
        console.error('Failed to initialize converter:', error);
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
