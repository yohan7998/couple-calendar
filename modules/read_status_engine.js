/**
 * Couple-Calendar Read Status Engine
 * 프로젝트: couple-calendar (v2.2.0)
 * 달콤살벌 캘린더 쪽지 및 일정 메모 읽음/안읽음 판정 및 동기화 엔진
 */
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ReadStatusEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {

    /**
     * 쪽지 읽음 여부 판정
     * 작성자 본인은 항상 true (본인 글은 읽지 않음 대상이 아님)
     * 수신자는 read === true 이거나 readBy 목록에 포함되어 있으면 true
     */
    function isNoteRead(note, currentUser) {
        if (!note) return true;
        if (note.author === currentUser) return true;
        if (note.read === true) return true;
        if (Array.isArray(note.readBy) && currentUser && note.readBy.includes(currentUser)) return true;
        return false;
    }

    /**
     * 쪽지를 읽음 상태로 마킹
     */
    function markNoteAsRead(note, currentUser) {
        if (!note) return note;
        note.read = true;
        note.readAt = new Date().toISOString();
        if (!Array.isArray(note.readBy)) {
            note.readBy = [];
        }
        if (currentUser && !note.readBy.includes(currentUser)) {
            note.readBy.push(currentUser);
        }
        return note;
    }

    /**
     * 쪽지를 안 읽음 상태로 되돌리기 (수동 토글)
     */
    function markNoteAsUnread(note, currentUser) {
        if (!note) return note;
        note.read = false;
        delete note.readAt;
        if (Array.isArray(note.readBy) && currentUser) {
            note.readBy = note.readBy.filter(u => u !== currentUser);
        }
        return note;
    }

    /**
     * 현재 사용자가 읽지 않은 쪽지 개수
     */
    function getUnreadNotesCount(notesList, currentUser) {
        if (!Array.isArray(notesList)) return 0;
        return notesList.filter(n => {
            if (n.author === currentUser) return false;
            return !isNoteRead(n, currentUser);
        }).length;
    }

    /**
     * 수신된 모든 쪽지 일괄 읽음 처리
     * @returns {number} 처리된 쪽지 건수
     */
    function markAllNotesAsRead(notesList, currentUser) {
        if (!Array.isArray(notesList)) return 0;
        let count = 0;
        notesList.forEach(n => {
            if (n.author !== currentUser && !isNoteRead(n, currentUser)) {
                markNoteAsRead(n, currentUser);
                count++;
            }
        });
        return count;
    }

    /**
     * 일정 메모 읽음 여부 판정
     * 메모가 없거나 작성자 본인이면 항상 true
     */
    function isScheduleMemoRead(schedule, currentUser) {
        if (!schedule || !schedule.memo || schedule.memo.trim() === '') return true;
        if (schedule.author === currentUser) return true;
        if (schedule.memoRead === true) return true;
        if (Array.isArray(schedule.memoReadBy) && currentUser && schedule.memoReadBy.includes(currentUser)) return true;
        if (Array.isArray(schedule.readBy) && currentUser && schedule.readBy.includes(currentUser)) return true;
        return false;
    }

    /**
     * 일정 메모를 읽음 상태로 마킹
     */
    function markScheduleMemoAsRead(schedule, currentUser) {
        if (!schedule) return schedule;
        schedule.memoRead = true;
        schedule.memoReadAt = new Date().toISOString();
        if (!Array.isArray(schedule.memoReadBy)) {
            schedule.memoReadBy = [];
        }
        if (currentUser && !schedule.memoReadBy.includes(currentUser)) {
            schedule.memoReadBy.push(currentUser);
        }
        if (!Array.isArray(schedule.readBy)) {
            schedule.readBy = [];
        }
        if (currentUser && !schedule.readBy.includes(currentUser)) {
            schedule.readBy.push(currentUser);
        }
        return schedule;
    }

    /**
     * 특정 날짜의 미확인 일정 메모 개수
     * 오버로딩 지원: (schedules, dateStr, currentUser) 또는 (dateStr, schedules, currentUser)
     */
    function getUnreadMemosCountForDate(arg1, arg2, arg3) {
        let schedulesList, dateStr, currentUser;
        if (Array.isArray(arg1)) {
            schedulesList = arg1;
            dateStr = arg2;
            currentUser = arg3;
        } else {
            dateStr = arg1;
            schedulesList = arg2;
            currentUser = arg3;
        }

        if (!Array.isArray(schedulesList) || !dateStr) return 0;

        return schedulesList.filter(s => {
            if (!s || !s.memo || s.memo.trim() === '') return false;
            let inDate = false;
            if (s.date === dateStr) {
                inDate = true;
            } else if (s.startDate && s.endDate) {
                inDate = (dateStr >= s.startDate && dateStr <= s.endDate);
            }
            if (!inDate) return false;
            return !isScheduleMemoRead(s, currentUser);
        }).length;
    }

    /**
     * GitHub Gist 동기화 시 로컬/원격 읽음 상태 무손실 병합 (OR 논리 & 최신 타임스탬프)
     */
    function mergeReadStatus(localItem, remoteItem) {
        if (!localItem && !remoteItem) return null;
        if (!localItem) return remoteItem;
        if (!remoteItem) return localItem;

        const merged = Object.assign({}, remoteItem, localItem);

        // 1. 쪽지 읽음 병합
        const isRead = (localItem.read === true || remoteItem.read === true);
        merged.read = isRead;
        if (localItem.readAt || remoteItem.readAt) {
            merged.readAt = (localItem.readAt && remoteItem.readAt)
                ? (localItem.readAt > remoteItem.readAt ? localItem.readAt : remoteItem.readAt)
                : (localItem.readAt || remoteItem.readAt);
        }

        // 2. 메모 읽음 병합
        const isMemoRead = (localItem.memoRead === true || remoteItem.memoRead === true);
        merged.memoRead = isMemoRead;
        if (localItem.memoReadAt || remoteItem.memoReadAt) {
            merged.memoReadAt = (localItem.memoReadAt && remoteItem.memoReadAt)
                ? (localItem.memoReadAt > remoteItem.memoReadAt ? localItem.memoReadAt : remoteItem.memoReadAt)
                : (localItem.memoReadAt || remoteItem.memoReadAt);
        }

        // 3. 독자 목록 Set 병합 (readBy & memoReadBy)
        const readBySet = new Set();
        if (Array.isArray(localItem.readBy)) localItem.readBy.forEach(r => readBySet.add(r));
        if (Array.isArray(remoteItem.readBy)) remoteItem.readBy.forEach(r => readBySet.add(r));
        merged.readBy = Array.from(readBySet);

        const memoReadBySet = new Set();
        if (Array.isArray(localItem.memoReadBy)) localItem.memoReadBy.forEach(r => memoReadBySet.add(r));
        if (Array.isArray(remoteItem.memoReadBy)) remoteItem.memoReadBy.forEach(r => memoReadBySet.add(r));
        merged.memoReadBy = Array.from(memoReadBySet);

        return merged;
    }

    return {
        isNoteRead: isNoteRead,
        markNoteAsRead: markNoteAsRead,
        markNoteAsUnread: markNoteAsUnread,
        getUnreadNotesCount: getUnreadNotesCount,
        markAllNotesAsRead: markAllNotesAsRead,
        isScheduleMemoRead: isScheduleMemoRead,
        markScheduleMemoAsRead: markScheduleMemoAsRead,
        getUnreadMemosCountForDate: getUnreadMemosCountForDate,
        mergeReadStatus: mergeReadStatus
    };
}));
