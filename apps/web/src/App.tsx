import { useEffect, useRef, useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { NotesPage } from './pages/NotesPage';
import { TodoEditor } from './components/todos/TodoEditor';
import { NoteEditor } from './components/notes/NoteEditor';
import { useWorkspace } from './hooks/useWorkspace';
import type { Note, Todo } from './types';

type Page = 'dashboard' | 'tasks' | 'notes';
const navItems: { id: Page; icon: string; label: string }[] = [{ id: 'dashboard', icon: '⌂', label: 'Dashboard' }, { id: 'tasks', icon: '✓', label: 'Tasks' }, { id: 'notes', icon: '▤', label: 'Notes' }];

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [todoEditor, setTodoEditor] = useState<Todo | null | undefined>(undefined);
  const [noteEditor, setNoteEditor] = useState<Note | null | undefined>(undefined);
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const workspace = useWorkspace();
  useEffect(() => {
    const refreshData = () => { setRefresh((value) => value + 1); void workspace.reload(); };
    window.addEventListener('todo-updated', refreshData);
    window.addEventListener('notes-updated', refreshData);
    return () => { window.removeEventListener('todo-updated', refreshData); window.removeEventListener('notes-updated', refreshData); };
  }, [workspace.reload]);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(''), 3200); return () => window.clearTimeout(timeout); }, [notice]);
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);
  const saved = () => { setRefresh((value) => value + 1); void workspace.reload(); setNotice('Saved — all set.'); };
  const pageTitle = page === 'dashboard' ? 'A little more in focus' : page === 'tasks' ? 'Your tasks' : 'Your notes';
  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };
  const sidebarContents = <>
    <a href="#dashboard" onClick={(event) => { event.preventDefault(); setPage('dashboard'); setMenuOpen(false); }} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest font-display text-xl font-semibold text-white">d</span><span><span className="block font-display text-lg font-semibold tracking-tight">daymark</span><span className="block text-[11px] tracking-wide text-muted">A LITTLE MORE IN FOCUS</span></span></a>
    <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-stone-400">WORKSPACE</p>
    <nav aria-label="Main navigation" className="flex flex-col gap-2">{navItems.map((item) => <button key={item.id} onClick={() => { setPage(item.id); setMenuOpen(false); }} aria-current={page === item.id ? 'page' : undefined} className={`nav-link w-full ${page === item.id ? 'nav-link-active' : ''}`}><span className="grid h-7 w-7 place-items-center rounded-lg text-base">{item.icon}</span>{item.label}{item.id === 'tasks' && workspace.todos.filter((todo) => !todo.completed).length > 0 && <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs text-muted">{workspace.todos.filter((todo) => !todo.completed).length}</span>}</button>)}</nav>
    <div className="mt-auto rounded-2xl bg-[#f5f7f4] p-4"><span className="text-lg">✳</span><p className="mt-2 text-sm font-medium">A gentle reminder</p><p className="mt-1 text-xs leading-relaxed text-muted">You don’t have to do it all today. Just the next thing.</p></div>
    <div className="mt-4 flex items-center gap-3 border-t border-stone-100 pt-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#eee8df] font-display font-semibold text-[#806954]">Y</span><span><span className="block text-sm font-medium">Your space</span><span className="block text-xs text-muted">Just for you</span></span></div>
  </>;
  return <div className="min-h-screen bg-canvas text-ink lg:flex">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 shrink-0 flex-col border-r border-stone-200/80 bg-white px-6 py-8 lg:flex">
      {sidebarContents}
    </aside>
    {menuOpen && <div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm lg:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
      <aside id="mobile-navigation" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Main navigation" className="flex h-full w-[min(20rem,85vw)] flex-col border-r border-stone-200 bg-white px-6 py-6 shadow-2xl animate-drawer-in">
        <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Menu</span><button ref={closeButtonRef} type="button" className="icon-button" onClick={closeMenu} aria-label="Close navigation">×</button></div>
        {sidebarContents}
      </aside>
    </div>}
    <div className="border-b border-stone-200/80 bg-white px-5 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <button ref={menuButtonRef} type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="mobile-navigation" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-stone-200 text-ink transition hover:bg-canvas focus-visible:outline-forest"><span className="flex w-[18px] flex-col gap-1" aria-hidden="true"><span className="h-0.5 w-full rounded bg-current"/><span className="h-0.5 w-full rounded bg-current"/><span className="h-0.5 w-full rounded bg-current"/></span></button>
        <span className="font-display text-base font-semibold">daymark</span>
      </div>
    </div>
    <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:ml-64 lg:px-12 lg:py-10 xl:px-16"><div className="mx-auto max-w-5xl"><header className="mb-7 flex items-center justify-between border-b border-stone-200/70 pb-4"><p className="text-sm font-medium text-muted">{pageTitle}</p><div className="flex items-center gap-2 rounded-full border border-stone-200/80 bg-white px-3 py-1.5 text-xs text-muted"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Your day, at your pace</div></header>
      {workspace.error && <div role="alert" className="state-error mb-5">{workspace.error}<button className="ml-3 font-medium underline" onClick={() => void workspace.reload()}>Try again</button></div>}
      {page === 'dashboard' && <DashboardPage todos={workspace.todos} notes={workspace.notes} loading={workspace.loading} onTasks={() => setPage('tasks')} onNotes={() => setPage('notes')} />}
      {page === 'tasks' && <TasksPage onAdd={() => setTodoEditor(null)} onEdit={setTodoEditor} onError={setNotice} refresh={refresh} />}
      {page === 'notes' && <NotesPage onAdd={() => setNoteEditor(null)} onEdit={setNoteEditor} onError={setNotice} refresh={refresh} />}
      </div></main>
    {todoEditor !== undefined && <TodoEditor todo={todoEditor} onClose={() => setTodoEditor(undefined)} onSaved={saved} onError={setNotice} />}
    {noteEditor !== undefined && <NoteEditor note={noteEditor} onClose={() => setNoteEditor(undefined)} onSaved={saved} onError={setNotice} />}
    {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white shadow-xl">{notice}</div>}
  </div>;
}
