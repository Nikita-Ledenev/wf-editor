<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useWorkflowStore } from '../store/workflow';

const store = useWorkflowStore();
const { pendingDeletes } = storeToRefs(store);
</script>

<template>
  <div :class="$style.stack" data-cy="undo-toasts">
    <TransitionGroup name="toast">
      <div
        v-for="p in pendingDeletes"
        :key="p.step.initialIndex"
        :class="$style.toast"
        data-cy="undo-toast"
        role="status"
      >
        <i class="fa-regular fa-trash-can" :class="$style.icon" aria-hidden="true" />
        <span :class="$style.text"> Состояние «{{ p.step.name }}» удалено </span>
        <button
          type="button"
          :class="$style.undo"
          data-cy="undo"
          @click="store.undoDelete(p.step.initialIndex)"
        >
          Отменить
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style module lang="scss">
@use 'tokens' as *;

.stack {
  position: fixed;
  left: $sidebar-strip-width + $space-4;
  bottom: $space-5;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.toast {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-3 $space-3 $space-4;
  background: #2e2e2e;
  color: #f5f5f5;
  border-radius: $radius-sm;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  font-size: $font-size-base;
}

.icon {
  color: #c9c9c9;
  font-size: 13px;
}

.text {
  white-space: nowrap;
}

.undo {
  margin-left: $space-2;
  padding: 4px 10px;
  background: transparent;
  border: $border-hairline solid rgba(255, 255, 255, 0.35);
  border-radius: 4px;
  color: #fff;
  font-family: $font-family-base;
  font-size: $font-size-base;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

:global(.toast-enter-active),
:global(.toast-leave-active) {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

:global(.toast-enter-from),
:global(.toast-leave-to) {
  opacity: 0;
  transform: translateY(8px);
}
</style>
