<script setup lang="ts">
import { onMounted } from 'vue';
import WorkflowPanel from './components/WorkflowPanel.vue';
import { useWorkflowStore } from './store/workflow';

const store = useWorkflowStore();

onMounted(() => {
  if (store.steps.length === 0) store.load();
});
</script>

<template>
  <WorkflowPanel />
</template>
