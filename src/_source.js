export const code_1 = `---
title: Awesome Title
author: Doug
date: Today

---

<script>
import Component from './Component1.svelte';
import Layout from './layout.svelte';

<\/script>
<Layout {title} {author} {date} >
<Component />

# Hi 
## Hello
### very small

\`\`\`ts
// comment
import statement from 'module'
let variable = 0
\`\`\`

</Layout>

`

export const code_2 = `
<h1>Hello</h1>

<style>
h1 {
  color: red;
}
</style>`
export const code_3 = `
<script>
  export let title;
  export let author;
  export let date;
<\/script>

<style>
  h1 {
    color: blue;
  }
</style>

<h1>{ title }</h1>

<slot>
</slot>

<p class="date">on: { date }</p>
<p class="date">by: { author }</p>

`
