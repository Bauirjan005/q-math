import React, { useState } from 'react';
import TeacherNavbar from '../../components/TeacherNavbar';
import TeacherDashboard from './TeacherDashboard';
import NotificationPopover from '../../components/NotificationPopover';
import MaterialUploadModal from './MaterialUploadModal';
import { Bell, X } from 'lucide-react';

export default function TeacherPortal({
  tests = [],
  students = [],
  notifications = [],
  unreadNotifsCount = 0,
  activeToast = null,
  onDismissToast,
  onRefreshTests,
  onPublishTest,
  onUpdateTest,
  onDeleteTest,
  onMarkNotifRead,
  onClearAllNotifs,
  onOpenFormulaSheet,
  onLogout
}) {
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="portal-container teacher-portal-root">
      {/* Exclusively Dedicated Teacher Navbar */}
      <TeacherNavbar
        unreadNotifsCount={unreadNotifsCount}
        onToggleNotifs={() => setIsNotifsOpen(!isNotifsOpen)}
        onOpenFormulaSheet={onOpenFormulaSheet}
        onOpenUploadModal={() => setIsUploadOpen(true)}
        onLogout={onLogout}
      />

      {/* Floating Real-Time Alert for Teacher (when a student registers or submits) */}
      {activeToast && (
        <div className="floating-notif-toast" onClick={onDismissToast}>
          <div className="toast-icon">
            <Bell size={18} className="text-cyan-400" />
          </div>
          <div className="toast-content">
            <div className="toast-title">{activeToast.title}</div>
            <div className="toast-msg">{activeToast.message}</div>
          </div>
          <button className="toast-close" onClick={onDismissToast}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Teacher Notifications Drawer */}
      <NotificationPopover
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onMarkRead={onMarkNotifRead}
        onClearAll={onClearAllNotifs}
      />

      {/* Main Teacher Workspace (Materials Upload, AI Generator, Questions Review, Analytics & Roster) */}
      <main className="main-content-area teacher-main-area">
        <TeacherDashboard
          tests={tests}
          students={students}
          onRefreshTests={onRefreshTests}
          onPublishTest={onPublishTest}
          onUpdateTest={onUpdateTest}
          onDeleteTest={onDeleteTest}
        />
      </main>

      {/* Upload & Generate Modal */}
      <MaterialUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onTestGenerated={() => {
          onRefreshTests();
          setIsUploadOpen(false);
        }}
      />
    </div>
  );
}
