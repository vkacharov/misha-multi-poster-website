import { defineStore } from 'pinia'

export const usePagesStore = defineStore('pages', {
  state: () => {
    return { 
      pages: [],
      selectedPageIds: []
    }
  },

  getters: {
    selectedPages: (state) => {
      return state.pages.filter(page => state.selectedPageIds.includes(page.id));
    }, 

    numberOfSelectedPageIds: (state) => {
      return state.selectedPageIds.length;
    }
  },

  actions: {
    setSelectedPageIds(selectedPageIds) {
      this.selectedPageIds = selectedPageIds;
    },

    setPages(pages) {
      this.pages = pages;
    }
  },
})