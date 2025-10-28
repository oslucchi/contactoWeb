<template>
  <div class="hello">
    <h1>{{ $t('dashboard.byCompany') }}</h1>
    <p>{{ $t('header.tagline') }}</p>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
};
</script>

<style scoped>
.hello {
  text-align: center;
  margin-top: 20px;
}
</style>