import { useState, useEffect, useRef, useCallback } from 'react';
import { dbGet, dbPut, STORE_BOOKS, STORE_PAGES } from '../db/index.js';

export default function Reader({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(1);
  const [backVisible, setBackVisible] = useState(true);
  const [pageAnimEnabled, setPageAnimEnabled] = useState(true);

  const pageRef = useRef(0);
  const totalRef = useRef(1);
  const bookRef = useRef(null);
  const isTurningRef = useRef(false);
  const backTimerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const prevEl = useRef(null);
  const currEl = useRef(null);
  const nextEl = useRef(null);
  const stageRef = useRef(null);

  const scheduleBackHide = useCallback(() => {
    clearTimeout(backTimerRef.current);
    setBackVisible(true);
    backTimerRef.current = setTimeout(() => setBackVisible(false), 2000);
  }, []);

  async function fillSlot(slotEl, pageIndex) {
    if (!slotEl) return;
    if (pageIndex < 0 || pageIndex >= totalRef.current) { slotEl.innerHTML = ''; return; }
    const record = await dbGet(STORE_PAGES, `${bookRef.current.id}:${pageIndex}`);
    if (!record) { slotEl.innerHTML = ''; return; }
    slotEl.innerHTML = typeof record === 'string' ? record : record.html;
    slotEl.parentElement.scrollTop = 0;
  }

  async function saveProgress(p) {
    if (!bookRef.current) return;
    bookRef.current.currentPage = p;
    await dbPut(STORE_BOOKS, bookRef.current);
  }

  async function turnPage(dir) {
    if (isTurningRef.current) return;
    const newPage = pageRef.current + dir;

    if (newPage < 0 || newPage >= totalRef.current) {
      if (stageRef.current) {
        stageRef.current.style.transform = `translateX(${dir < 0 ? '8px' : '-8px'})`;
        stageRef.current.style.transition = 'transform 0.1s';
        setTimeout(() => {
          if (stageRef.current) {
            stageRef.current.style.transform = '';
            setTimeout(() => { if (stageRef.current) stageRef.current.style.transition = ''; }, 200);
          }
        }, 100);
      }
      return;
    }

    isTurningRef.current = true;
    const stage = stageRef.current;

    stage.classList.add(dir > 0 ? 'turning-forward' : 'turning-back');
    pageRef.current = newPage;
    setPage(newPage);
    saveProgress(newPage);

    setTimeout(async () => {
      stage.classList.remove('turning-forward', 'turning-back');
      const slots = stage.querySelectorAll('.reader-slot');
      slots.forEach(s => s.style.transition = 'none');

      if (dir > 0) {
        prevEl.current.innerHTML = currEl.current.innerHTML;
        currEl.current.innerHTML = nextEl.current.innerHTML;
        nextEl.current.innerHTML = '';
      } else {
        nextEl.current.innerHTML = currEl.current.innerHTML;
        currEl.current.innerHTML = prevEl.current.innerHTML;
        prevEl.current.innerHTML = '';
      }
      currEl.current.parentElement.scrollTop = 0;

      requestAnimationFrame(() => {
        slots.forEach(s => {
          s.style.transition = '';
          s.style.transitionDuration = pageAnimEnabled ? '0.32s' : '0s';
        });
      });

      await fillSlot(dir > 0 ? nextEl.current : prevEl.current, pageRef.current + (dir > 0 ? 1 : -1));
      isTurningRef.current = false;
    }, 330);
  }

  useEffect(() => {
    async function init() {
      const b = await dbGet(STORE_BOOKS, bookId);
      if (!b) return;
      bookRef.current = b;
      pageRef.current = b.currentPage || 0;
      totalRef.current = b.totalPages || 1;
      setBook(b);
      setPage(b.currentPage || 0);
      setTotal(b.totalPages || 1);

      await fillSlot(currEl.current, pageRef.current);
      await fillSlot(prevEl.current, pageRef.current - 1);
      await fillSlot(nextEl.current, pageRef.current + 1);
      scheduleBackHide();
    }
    init();
    return () => clearTimeout(backTimerRef.current);
  }, [bookId]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') turnPage(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') turnPage(-1);
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function onTouchStart(e) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    scheduleBackHide();
  }

  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) turnPage(dx < 0 ? 1 : -1);
  }

  return (
    <div id="reader-view" className="view no-nav active">
      <div
        id="reader-stage"
        ref={stageRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="reader-slot slot-prev" id="slot-prev">
          <div className="reader-page" ref={prevEl} id="page-prev" />
        </div>
        <div className="reader-slot slot-curr" id="slot-curr">
          <div className="reader-page" ref={currEl} id="page-curr" />
        </div>
        <div className="reader-slot slot-next" id="slot-next">
          <div className="reader-page" ref={nextEl} id="page-next" />
        </div>
      </div>

      <div id="tap-prev" onClick={() => turnPage(-1)} />
      <div id="tap-next" onClick={() => turnPage(1)} />

      <button
        id="reader-back"
        className={backVisible ? '' : 'hidden'}
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div id="reader-progress">{page + 1} / {total}</div>
    </div>
  );
}
