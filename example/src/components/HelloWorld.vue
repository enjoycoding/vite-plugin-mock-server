<template>
  <h1>{{ msg }}</h1>

  <p>
    Visit mock APIs:
    <p><a href="/api/hello1" target="hello1">Hello</a></p>
    <p><a href="/api/test1/users/octoape" target="hello1">Path variables</a></p>
    <form action="/api/test1/users/octoape?query=Search" method="post" target="_blank">
      <input name="username" value="octoape"/>@
      <input name="domain" value="test.com"/>
      <button type="submit">submit test</button>
    </form>
  </p>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'
export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: {
      type: String,
      required: true
    }
  },
  setup: () => {
    const count = ref(0)
    return { count }
  }
})
</script>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}
</style>
