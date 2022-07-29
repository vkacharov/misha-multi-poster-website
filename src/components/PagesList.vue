<script>
import { reactive } from 'vue'
import { login, getAccounts } from '../services/facebook'
import TableLite from "vue3-table-lite";
import {usePagesStore} from '../stores/pages.js'

export default {
  components: { TableLite },

  async setup() {
    const loginResponse = await login();
    // TODO validate loginResponse
    const accounts = await getAccounts();
    const pagesStore = usePagesStore();

    const rows = accounts.map(account => {
      return {
        id: account.id, 
        name: account.name,
        access_token: account.access_token
      };
    });

    const table = reactive({
      isLoading: false,
        sortable: {
      },
      columns: [
        {
          label: "Link",
          field: "id",
          sortable: false,
          isKey: true,
          width: "30%", 
          display: (row) => {
            const url =`https://www.facebook.com/${row.id}`;
            return `<a href="${url}"  target=”_blank”>${url}</a>`;
          }
        },
        {
          label: "Name",
          field: "name",
          sortable: false,
          width: "70%"
        },
      ],
      rows: rows,
      totalRecordCount: rows.length,
    });
    
    pagesStore.setPages(rows);

    const updateCheckedRows = (rowsKey) => {
      pagesStore.setSelectedPageIds(rowsKey);
    };
    return {
      table,
      updateCheckedRows,
    };
  }
}
</script>

<template>
  <h1>Misha Multi Poster</h1>
  <h2>Select your pages</h2>

<table-lite
:has-checkbox="true"
:is-loading="table.isLoading"
:columns="table.columns"
:rows="table.rows"
:total="table.totalRecordCount"
:sortable="table.sortable"
@is-finished="table.isLoading = false"
:isHidePaging="true"
@return-checked-rows="updateCheckedRows"
/>
</template>

<style scoped>
</style>
