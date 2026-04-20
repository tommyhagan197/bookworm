import { useRef } from 'react';
import { processEpubBuffer } from '../reader/pipeline.js';

export default function UploadView({ onShowToast, onShowLoading, onHideLoading, onSetProgress, onDone }) {
  const inputRef = useRef(null);
  const dragRef = useRef(false);

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.epub')) { onShowToast('Please upload an EPUB file'); return; }
    const buffer = await file.arrayBuffer();
    onShowLoading('Reading EPUB…', 5);
    try {
      const result = await processEpubBuffer(buffer, file.name, {}, {
        onProgress: (msg, pct) => onSetProgress(msg, pct)
      });
      await new Promise(r => setTimeout(r, 400));
      onHideLoading();
      onShowToast(`"${result.title}" added — ${result.totalPages} pages`);
      onDone();
    } catch(e) {
      onHideLoading();
      onShowToast('Failed to read EPUB: ' + e.message);
    }
  }

  function onDragOver(e) { e.preventDefault(); dragRef.current = true; e.currentTarget.classList.add('drag-over'); }
  function onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
  async function onDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.epub')) await handleFile(file);
    else onShowToast('Please upload an EPUB file');
  }

  return (
    <div id="upload-view" className="view active">
      <div className="view-header">
        <h1>Add Book</h1>
        <div className="subtitle">Import your own EPUB</div>
      </div>
      <div className="scroll-content">
        <div
          className="upload-zone"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12l7-7 7 7"/>
            </svg>
          </div>
          <h2>Choose an EPUB file</h2>
          <p>Tap to browse, or drag and drop an EPUB here</p>
          <input
            ref={inputRef}
            id="file-input"
            type="file"
            accept=".epub"
            style={{display:'none'}}
            onChange={e => { const f = e.target.files[0]; e.target.value=''; if(f) handleFile(f); }}
          />
        </div>
        <div className="format-cards">
          <div className="format-card recommended">
            <div className="format-badge recommended">RECOMMENDED</div>
            <h3>EPUB</h3>
            <p>Reflowable text, beautiful typography, responsive layout.</p>
          </div>
          <div className="format-card disabled">
            <div className="format-badge">COMING SOON</div>
            <h3>PDF</h3>
            <p>Fixed layout. Not yet supported for quality reasons.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
