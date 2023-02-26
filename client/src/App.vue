<template>
  <div class="overflow-x-auto">
    <table class="width min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Laptop Name
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Price
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            GPU
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="row in data" :key="row.Laptop">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">
              {{ row.Laptop }}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">{{ row.Price }}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">{{ row.GPU }}</div>
          </td>
        </tr>
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">Jane Doe</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">janedoe@example.com</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">(555) 555-5555</div>
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <input type="file" @change="handleFileUpload" />
      <button @click="uploadFile">Upload</button>
    </div>
    <div class="range">
      <div>
        <form @submit.prevent="downloadFiles(this.startDate, this.endDate)">
          <div>
            <label for="start-date">Start Date</label>
            <input id="start-date" type="date" v-model="startDate" />
          </div>
          <div>
            <label for="end-date">End Date</label>
            <input id="end-date" type="date" v-model="endDate" />
          </div>
          <button type="submit">Download Files</button>
        </form>

        <form @submit.prevent="download">
          <button type="submit">Download TXT Files</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      data: [],
      file: null,
      startDate: "",
      endDate: "",
    };
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      const response = await axios.get("http://localhost:3000/excel");
      console.log(response.data);
      this.data = response.data;
    },
    handleFileUpload(event) {
      this.file = event.target.files[0];
    },
    async uploadFile() {
      const formData = new FormData();
      formData.append("file", this.file);

      try {
        const response = await axios.post(
          "http://localhost:3000/upload",
          formData
        );
        console.log(response.data);
      } catch (error) {
        console.error(error);
      }
    },

    async downloadFiles(startDate, endDate) {
      const url = "http://localhost:3000/download";

      console.log("Date: " + startDate + "," + endDate);

      await axios
        .get(url, {
          params: {
            startDate: this.startDate,
            endDate: this.endDate,
          },
          responseType: "blob",
        })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `files.zip`);
          document.body.appendChild(link);
          link.click();
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async download() {
      await axios
        .get("http://localhost:3000/file", { responseType: "blob" })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "file.txt");
          document.body.appendChild(link);
          link.click();
        });
    },
  },
};
</script>

<style></style>
