<script setup lang="ts">
import { strokeColor, type WorkflowStep } from '@wf/shared';
import { storeToRefs } from 'pinia';
import { nextTick, ref, watch } from 'vue';
import { useWorkflowStore, type SortKey } from '../store/workflow';

const store = useWorkflowStore();
const { visibleSteps, selectedIndex, sort, stepByIndex } = storeToRefs(store);

const editingIndex = ref<number | null>(null);
const draft = ref('');
const editInput = ref<HTMLInputElement | null>(null);
const scroller = ref<HTMLElement | null>(null);

function startEdit(step: WorkflowStep) {
  editingIndex.value = step.initialIndex;
  draft.value = step.name;
  nextTick(() => editInput.value?.focus());
}

function commitEdit() {
  if (editingIndex.value === null) return;
  store.renameStep(editingIndex.value, draft.value);
  editingIndex.value = null;
}

function cancelEdit() {
  editingIndex.value = null;
}

function transitionsOf(step: WorkflowStep): WorkflowStep[] {
  return step.nextSteps
    .map((i) => stepByIndex.value.get(i))
    .filter((s): s is WorkflowStep => Boolean(s));
}

function sortCaret(key: SortKey): string {
  if (sort.value.key !== key) return 'fa-sort';
  return sort.value.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
}

function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sort.value.key !== key) return 'none';
  return sort.value.dir === 'asc' ? 'ascending' : 'descending';
}

function selectRow(step: WorkflowStep) {
  store.select(step.initialIndex);
  scroller.value?.focus();
}

// Перемещение выделения стрелками по видимым (отфильтрованным/сортированным) строкам.
function moveSelection(delta: number) {
  const rows = visibleSteps.value;
  if (rows.length === 0) return;
  const cur = rows.findIndex((s) => s.initialIndex === selectedIndex.value);
  const next =
    cur === -1
      ? delta > 0
        ? 0
        : rows.length - 1
      : Math.min(rows.length - 1, Math.max(0, cur + delta));
  store.select(rows[next].initialIndex);
}

// Горячие клавиши таблицы. Когда фокус в input (поиск/редактирование) — не вмешиваемся.
function onKeydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const sel = selectedIndex.value;
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      moveSelection(1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      moveSelection(-1);
      break;
    case 'Enter':
      e.preventDefault();
      store.createStep();
      break;
    case 'Delete':
    case 'Backspace': // на Mac «delete» — это Backspace
      if (sel !== null) {
        e.preventDefault();
        store.deleteStep(sel);
      }
      break;
    case 'Escape':
      if (sel !== null) {
        e.preventDefault();
        store.select(null);
      }
      break;
    case 'F2':
      if (sel !== null) {
        const step = stepByIndex.value.get(sel);
        if (step) {
          e.preventDefault();
          startEdit(step);
        }
      }
      break;
  }
}

// Выбор пришёл из диаграммы — подкручиваем строку в зону видимости.
watch(selectedIndex, async (idx) => {
  if (idx === null) return;
  await nextTick();
  scroller.value
    ?.querySelector<HTMLElement>(`[data-row="${idx}"]`)
    ?.scrollIntoView({ block: 'nearest' });
});
</script>

<template>
  <div
    ref="scroller"
    :class="$style.scroller"
    data-cy="table"
    tabindex="0"
    role="grid"
    aria-label="Состояния процесса. Стрелки — навигация, Enter — создать, Delete — удалить, F2 — переименовать, Esc — снять выделение"
    @keydown="onKeydown"
  >
    <table :class="$style.table">
      <thead>
        <tr>
          <th
            :class="[$style.th, $style.thSortable]"
            role="button"
            tabindex="0"
            :aria-sort="ariaSort('name')"
            @click="store.setSort('name')"
            @keydown.enter.prevent="store.setSort('name')"
            @keydown.space.prevent="store.setSort('name')"
          >
            <span>Состояние</span>
            <i class="fa-solid" :class="sortCaret('name')" aria-hidden="true" />
          </th>
          <th
            :class="[$style.th, $style.thNum, $style.thSortable]"
            role="button"
            tabindex="0"
            :aria-sort="ariaSort('x')"
            @click="store.setSort('x')"
            @keydown.enter.prevent="store.setSort('x')"
            @keydown.space.prevent="store.setSort('x')"
          >
            <span>x</span>
            <i class="fa-solid" :class="sortCaret('x')" aria-hidden="true" />
          </th>
          <th
            :class="[$style.th, $style.thNum, $style.thSortable]"
            role="button"
            tabindex="0"
            :aria-sort="ariaSort('y')"
            @click="store.setSort('y')"
            @keydown.enter.prevent="store.setSort('y')"
            @keydown.space.prevent="store.setSort('y')"
          >
            <span>y</span>
            <i class="fa-solid" :class="sortCaret('y')" aria-hidden="true" />
          </th>
          <th :class="$style.th">Переходы</th>
          <th :class="[$style.th, $style.thAction]" aria-label="Действия" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="step in visibleSteps"
          :key="step.initialIndex"
          :class="[$style.row, { [$style.rowSelected]: step.initialIndex === selectedIndex }]"
          :data-row="step.initialIndex"
          :data-selected="step.initialIndex === selectedIndex ? 'true' : 'false'"
          data-cy="row"
          @click="selectRow(step)"
        >
          <td :class="[$style.td, $style.tdName]">
            <i
              class="fa-regular fa-file"
              :class="$style.fileIcon"
              :style="{ color: strokeColor(step.color) }"
              aria-hidden="true"
            />
            <input
              v-if="editingIndex === step.initialIndex"
              ref="editInput"
              v-model="draft"
              :class="$style.editInput"
              data-cy="name-input"
              @click.stop
              @keydown.enter.prevent="commitEdit"
              @keydown.esc.prevent="cancelEdit"
              @blur="commitEdit"
            />
            <span
              v-else
              :class="$style.name"
              :title="step.name"
              data-cy="name"
              @dblclick.stop="startEdit(step)"
              >{{ step.name }}</span
            >
          </td>

          <td :class="[$style.td, $style.tdNum]">{{ step.x }}</td>
          <td :class="[$style.td, $style.tdNum]">{{ step.y }}</td>

          <td :class="[$style.td, $style.tdTransitions]">
            <span :class="$style.transitions">
              <span
                v-for="(target, i) in transitionsOf(step)"
                :key="target.initialIndex"
                :class="$style.transition"
              >
                <i
                  class="fa-regular fa-file"
                  :class="$style.fileIcon"
                  :style="{ color: strokeColor(target.color) }"
                  aria-hidden="true"
                />
                <span>{{ target.name }}</span
                ><span v-if="i < transitionsOf(step).length - 1">,&nbsp;</span>
              </span>
            </span>
          </td>

          <td :class="[$style.td, $style.tdAction]">
            <button
              :class="$style.deleteBtn"
              type="button"
              data-cy="delete"
              aria-label="Удалить состояние"
              @click.stop="store.deleteStep(step.initialIndex)"
            >
              <i class="fa-regular fa-trash-can" aria-hidden="true" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style module lang="scss">
@use 'tokens' as *;

.scroller {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  border-radius: $radius-sm;
  outline: none;

  // Видимое кольцо фокуса только при навигации с клавиатуры.
  &:focus-visible {
    outline: 2px solid $color-sidebar-strip;
    outline-offset: -2px;
  }
}

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.th {
  position: sticky;
  top: 0;
  z-index: $z-table-head;
  padding: $space-3 $cell-padding-x;
  text-align: left;
  font-size: $font-size-base;
  font-weight: $font-weight-regular;
  color: $color-text-muted;
  background: $color-table-head-bg;
  white-space: nowrap;
  user-select: none;

  &:first-child {
    border-top-left-radius: $radius-sm;
    border-bottom-left-radius: $radius-sm;
  }

  &:last-child {
    border-top-right-radius: $radius-sm;
    border-bottom-right-radius: $radius-sm;
  }

  i {
    margin-left: $space-1;
    font-size: 11px;
    opacity: 0.6;
  }
}

.thSortable {
  cursor: pointer;

  &:hover {
    color: $color-text-secondary;
  }
}

.thNum {
  width: 64px;
  text-align: right;
}

.thAction {
  width: 48px;
}

.row {
  cursor: pointer;
  border-bottom: $border-hairline solid $color-divider;

  &:hover:not(.rowSelected) {
    background: $color-row-hover-bg;
  }
}

.rowSelected {
  border-bottom-color: transparent;

  .td {
    background: $color-row-selected-bg;
  }

  .td:first-child {
    border-top-left-radius: $radius-sm;
    border-bottom-left-radius: $radius-sm;
  }

  .td:last-child {
    border-top-right-radius: $radius-sm;
    border-bottom-right-radius: $radius-sm;
  }
}

.td {
  height: $row-height;
  padding: 0 $cell-padding-x;
  font-size: $font-size-cell;
  color: $color-text-primary;
  vertical-align: middle;
}

.tdName {
  display: flex;
  align-items: center;
  gap: $icon-gap;
  height: $row-height;
}

.fileIcon {
  flex: 0 0 auto;
  font-size: $icon-size-file;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editInput {
  flex: 1 1 auto;
  min-width: 0;
  font-family: $font-family-base;
  font-size: $font-size-cell;
  color: $color-text-primary;
  padding: 4px 6px;
  border: $border-hairline solid $color-sidebar-strip;
  border-radius: 4px;
  outline: none;
}

.tdNum {
  text-align: right;
  color: $color-text-secondary;
  font-variant-numeric: tabular-nums;
}

.tdTransitions {
  max-width: 0;
}

.transitions {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: $font-size-base;
  color: $color-text-title;
}

.transition {
  i {
    margin-right: 6px;
  }
}

.tdAction {
  text-align: right;
}

.deleteBtn {
  border: none;
  background: transparent;
  padding: 6px;
  cursor: pointer;
  color: $color-icon-trash;
  font-size: $icon-size-trash;
  line-height: 1;
  border-radius: 4px;

  &:hover {
    color: $step-red;
  }
}
</style>
