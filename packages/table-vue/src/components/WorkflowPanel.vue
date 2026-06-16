<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useWorkflowStore } from '../store/workflow';
import DeleteToasts from './DeleteToasts.vue';
import WorkflowTable from './WorkflowTable.vue';

const store = useWorkflowStore();
const { error, search, newColor } = storeToRefs(store);

// Палитра для нового шага: белый (по умолчанию) + цвета из данных процесса.
const PALETTE = ['#ffffff', '#666666', '#aa8800', '#0044aa', '#a02c2c', '#338000'];
</script>

<template>
  <div :class="$style.panel">
    <header :class="$style.header">
      <h1 :class="$style.title">Структура рабочего процесса</h1>
      <div :class="$style.actions">
        <div
          :class="$style.palette"
          role="group"
          aria-label="Цвет нового состояния"
          title="Цвет нового состояния"
        >
          <button
            v-for="c in PALETTE"
            :key="c"
            type="button"
            :class="[
              $style.swatch,
              { [$style.swatchActive]: c.toLowerCase() === newColor.toLowerCase() },
            ]"
            :style="{ background: c }"
            :data-cy="`color-${c}`"
            :aria-label="`Цвет ${c}`"
            :aria-pressed="c.toLowerCase() === newColor.toLowerCase()"
            @click="store.setNewColor(c)"
          />
          <label :class="$style.swatchCustom" title="Свой цвет">
            <i class="fa-solid fa-eye-dropper" aria-hidden="true" />
            <input
              type="color"
              :value="newColor"
              data-cy="color-custom"
              @input="store.setNewColor(($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
        <button
          :class="$style.createBtn"
          type="button"
          data-cy="create-step"
          @click="store.createStep()"
        >
          <i class="fa-solid fa-plus" aria-hidden="true" />
          <span>Создать состояние</span>
        </button>
      </div>
    </header>

    <div :class="$style.tools">
      <div :class="$style.searchBox">
        <i class="fa-solid fa-magnifying-glass" :class="$style.searchIcon" aria-hidden="true" />
        <input
          :class="$style.searchInput"
          type="search"
          placeholder="Поиск состояния…"
          aria-label="Поиск состояния"
          data-cy="search"
          :value="search"
          @input="store.setSearch(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <p v-if="error" :class="$style.error" data-cy="error">{{ error }}</p>

    <WorkflowTable />
    <DeleteToasts />
  </div>
</template>

<style module lang="scss">
@use 'tokens' as *;

.panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  padding: $panel-padding $space-2 $panel-padding $panel-padding;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  margin-bottom: $space-5;
}

.title {
  margin: 0;
  font-size: $font-size-title;
  font-weight: $font-weight-regular;
  color: $color-text-title;
  letter-spacing: 0.1px;
}

.actions {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.palette {
  display: flex;
  align-items: center;
  gap: 5px;
}

.swatch {
  width: 18px;
  height: 18px;
  padding: 0;
  border: $border-hairline solid rgba(0, 0, 0, 0.18);
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    transform: scale(1.12);
  }
}

.swatchActive {
  outline: 2px solid $color-text-secondary;
  outline-offset: 1px;
}

.swatchCustom {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: $border-hairline solid rgba(0, 0, 0, 0.18);
  border-radius: 4px;
  cursor: pointer;
  color: $color-text-muted;
  font-size: 10px;

  input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
}

.createBtn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  font-family: $font-family-base;
  font-size: $font-size-base;
  color: $color-text-btn;
  background: $color-btn-bg;
  border: $border-hairline solid transparent;
  border-radius: $radius-sm;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.12s ease;

  i {
    color: $color-icon-plus;
    font-size: 13px;
  }

  &:hover {
    background: $color-btn-bg-hover;
  }
}

.tools {
  margin-bottom: $space-3;
}

.searchBox {
  position: relative;
  display: flex;
  align-items: center;
}

.searchIcon {
  position: absolute;
  left: $space-3;
  font-size: 13px;
  color: $color-text-muted;
  pointer-events: none;
}

.searchInput {
  width: 100%;
  height: 36px;
  padding: 0 $space-3 0 34px;
  font-family: $font-family-base;
  font-size: $font-size-base;
  color: $color-text-primary;
  background: #fff;
  border: $border-hairline solid $color-border-hairline;
  border-radius: $radius-sm;
  outline: none;

  &::placeholder {
    color: $color-text-muted;
  }

  &:focus {
    border-color: $color-sidebar-strip;
  }
}

.error {
  margin: 0 0 $space-3;
  padding: $space-2 $space-3;
  font-size: $font-size-base;
  color: $step-red;
  background: rgba($step-red, 0.07);
  border-radius: $radius-sm;
}
</style>
