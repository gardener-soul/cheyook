# Mobile Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all pages and components mobile-friendly so the app works well on narrow screens (360–430px).

**Architecture:** Apply responsive Tailwind classes (mobile-first) to existing components — no new components needed. Stack two-column layouts vertically on mobile, fix touch targets, reduce wasted whitespace, and ensure modals/tabs don't overflow.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, React

---

## File Map

| File | Change |
|------|--------|
| `src/components/CarpoolClient.tsx` | Stack car list + unassigned vertically on mobile |
| `src/app/admin/AdminTabs.tsx` | Scrollable tab bar + larger participant action buttons |
| `src/components/admin/GameForm.tsx` | Collapse 2-col grid to 1-col on mobile |
| `src/app/login/page.tsx` | Reduce top margin on mobile |
| `src/app/register/page.tsx` | Reduce top margin on mobile |
| `src/components/UnassignedList.tsx` | Larger touch targets for list items |

---

### Task 1: CarpoolClient — stack layout on mobile

**Files:**
- Modify: `src/components/CarpoolClient.tsx`

- [ ] **Step 1: Replace the layout wrapper and column divs**

Replace the entire `return (...)` block in `src/components/CarpoolClient.tsx` with:

```tsx
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* 차량 목록 */}
        <div className="md:flex-[1.6]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">🚗 카풀</h1>
            {showRegisterButton && (
              <button
                onClick={() => setShowRegister(true)}
                className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700"
              >
                내 차 등록
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onClick={() => setSelectedCarId(car.id)}
              />
            ))}
            <button
              onClick={() => {
                if (!currentUser) {
                  alert('차량을 등록하려면 로그인하세요.')
                  return
                }
                setShowRegister(true)
              }}
              className="w-full text-left border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors text-sm"
            >
              + 차량 등록하기
            </button>
          </div>
        </div>

        {/* 미배정 명단 */}
        <div className="bg-yellow-50 rounded-2xl p-4 md:flex-[1] md:sticky md:top-4">
          <UnassignedList users={unassigned} />
        </div>
      </div>

      {selectedCar && (
        <CarModal
          car={selectedCar}
          currentUser={currentUser}
          unassigned={unassigned}
          onClose={() => setSelectedCarId(null)}
          isGloballyAssigned={isAlreadyRegistered}
        />
      )}

      {showRegister && (
        <CarRegisterModal
          onClose={() => {
            setShowRegister(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd c:/Users/wbype/Desktop/cheyook && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/CarpoolClient.tsx
git commit -m "fix(mobile): stack carpool layout vertically on mobile"
```

---

### Task 2: AdminTabs — scrollable tab bar + larger action buttons

**Files:**
- Modify: `src/app/admin/AdminTabs.tsx`

- [ ] **Step 1: Fix tab bar overflow**

In `src/app/admin/AdminTabs.tsx`, change line 28:

```tsx
// BEFORE
      <div className="flex gap-2 mb-6 border-b">
// AFTER
      <div className="flex mb-6 border-b overflow-x-auto">
```

- [ ] **Step 2: Fix participant action button touch targets**

In the same file, find the 선발/탈락 buttons (lines 136–145). Replace both buttons with larger padding:

```tsx
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelect(p.id, 'selected')}
                    className={`px-3 py-1.5 rounded text-xs ${p.status === 'selected' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-green-100'}`}
                  >
                    선발
                  </button>
                  <button
                    onClick={() => handleSelect(p.id, 'rejected')}
                    className={`px-3 py-1.5 rounded text-xs ${p.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-red-100'}`}
                  >
                    탈락
                  </button>
                </div>
```

- [ ] **Step 3: Fix participant row wrapping on mobile**

Change the participant row div (line 125–133):

```tsx
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 text-sm border rounded px-3 py-2 flex-wrap"
              >
                <span className="flex-1 min-w-0">
                  {p.users?.village} · {p.users?.name}
                  <span className={`ml-2 text-xs ${p.status === 'selected' ? 'text-green-600' : p.status === 'rejected' ? 'text-red-500' : 'text-gray-400'}`}>
                    ({p.status === 'selected' ? '선발' : p.status === 'rejected' ? '탈락' : '대기'})
                  </span>
                </span>
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd c:/Users/wbype/Desktop/cheyook && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/AdminTabs.tsx
git commit -m "fix(mobile): scrollable admin tabs, larger participant action buttons"
```

---

### Task 3: GameForm — collapse 2-col grid on mobile

**Files:**
- Modify: `src/components/admin/GameForm.tsx`

- [ ] **Step 1: Change grid breakpoint**

In `src/components/admin/GameForm.tsx`, change line 60:

```tsx
// BEFORE
      <div className="grid grid-cols-2 gap-2">
// AFTER
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/GameForm.tsx
git commit -m "fix(mobile): collapse GameForm 2-col grid to 1-col on mobile"
```

---

### Task 4: Login + Register pages — reduce top margin on mobile

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`

- [ ] **Step 1: Fix login page top margin**

In `src/app/login/page.tsx`, change line 35:

```tsx
// BEFORE
    <div className="max-w-sm mx-auto mt-12">
// AFTER
    <div className="max-w-sm mx-auto mt-6 sm:mt-12">
```

- [ ] **Step 2: Fix register page top margin**

In `src/app/register/page.tsx`, change line 35:

```tsx
// BEFORE
    <div className="max-w-sm mx-auto mt-12">
// AFTER
    <div className="max-w-sm mx-auto mt-6 sm:mt-12">
```

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx src/app/register/page.tsx
git commit -m "fix(mobile): reduce top margin on login/register pages"
```

---

### Task 5: UnassignedList — larger touch targets

**Files:**
- Modify: `src/components/UnassignedList.tsx`

- [ ] **Step 1: Increase list item padding for 44px touch target**

In `src/components/UnassignedList.tsx`, replace the `<li>` element (lines 22–30):

```tsx
            <li
              key={u.id}
              className={`flex items-center justify-between px-3 py-3 rounded text-sm min-h-[44px] ${
                onInvite ? 'cursor-pointer hover:bg-yellow-200 active:bg-yellow-300' : ''
              }`}
              onClick={onInvite ? () => onInvite(u.id) : undefined}
            >
              <span className="font-medium">{u.name}</span>
              <span className="text-gray-500 text-xs">{u.village}</span>
            </li>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UnassignedList.tsx
git commit -m "fix(mobile): larger touch targets in UnassignedList"
```
