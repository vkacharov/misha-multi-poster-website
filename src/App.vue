<script setup>
    import PagesList from './components/PagesList.vue';
    import PageActions from './components/PageActions.vue';
</script>

<template>
  <Suspense>
    <template #default>
    <PagesList />
    </template>
    <template #fallback>
      Loading ...
    </template>
  </Suspense>

  <PageActions />
  <notifications position="bottom right" group="errored" />
  <notifications position="bottom left" group="succeeded" />
</template>


<style>
</style>
