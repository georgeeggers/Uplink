<script lang='ts'>
    import { pb } from '../pocketbase.svelte'
    import { ClientResponseError } from 'pocketbase';
    import { onMount, onDestroy } from "svelte";
    
    let file = $state(null);
    let file_name = $state("None");
    let visibility = $state("hidden");
    let announce_header = $state("");
    let announce_body = $state("");
    let announce_upload = $state(false)

    const handleFileChange = (e) => { 
        file = e.target.files[0];
        file_name = file.name;
        console.log(file.size);
        announce_upload = true;
        if(file.size > 50000000){
            announce("Big ol\' file", "That file is pretty big. It might take a hot minute to upload", 5000);
        } else if(file.size > 500000000){
            announce("Goodness gracious that\'s a huge file", "That file is pretty massive. You know what else is massive??? The amount of time it'll take to upload", 5000);
        } else if (file.size > 1000000000){
            announce("🚨 🚨 Big file alert 🚨 🚨", "That file is more than a GB. If you haven't zipped it already, please do so...", 5000);
        } else {
            announce_upload = false;
        }
    };
    let file_list = $state([]);

    const download = (index) => {
        const url = pb.files.getURL(file_list[index], file_list[index].data) + "?download=1";
        return url
    }

    const get_thumbnail = (index) => {
        const url = pb.files.getURL(file_list[index], file_list[index].data, { 'thumb': '256x256'} );
        return url
    }

    const toggle_visibility = () => {
        if(visibility == "hidden"){
            visibility = "";
        } else {
            visibility = "hidden";
        }
    }

    const announce = (header, content, time) => {
        announce_header = header;
        announce_body = content;
        toggle_visibility();
        setTimeout(() => {
            toggle_visibility();
        }, time);
    }

    async function upload() {
        try {
            const data = {
                "name": file_name,
                "data": file
            }

            if(announce_upload){
                announce_body = "Please don't turn your computer off";
                announce_header = "Uploading file. Sit tight";
                visibility = "";
            }


            const upload = await pb.collection('Files').create(data);
            if(upload){
                console.log("File Uploaded");
            }
            file = null;
            file_name = "None";
            if(announce_upload){
                visibility = "hidden";
            }
        } catch (err) {
            if(err instanceof ClientResponseError){
                if (err.status == 400){
                    announce("Invalid File", "Failed to upload because of an invalid file. Select a different file, or try zipping it", 5000);
                } else if (err.status == 0){
                    announce("Network Error", "Could not connect to the file server. Try again later", 5000);
                }
            } else {
                announce("Error", "Something went wrong. Try again later", 5000);
            }
        }
    }

    let unsubscribe: () => void;
    onMount(async () => {
        console.log("mounting and subscribing");
        const response = await pb.collection("Files").getList(1, 25, {
            sort: '-created',
        });
        file_list = response.items;
        unsubscribe = await pb
            .collection('Files')
            .subscribe("*", async ({ action, record }) => {
                if(action === "create"){
                    console.log("jacsijfijoa");
                    file_list.push(record);
                }
            });
    });

    onDestroy(() => {
        unsubscribe?.();
    });

    async function delete_file(index) {
        await pb.collection("Files").delete(file_list[index].id);
        file_list.splice(index, 1);
    }

</script>

<div class="notification {visibility}">
    <span class="header">
        <h1>{announce_header}</h1>
    </span>

    <p1>{announce_body}</p1>
</div>

<input
    type="file"
    onchange={handleFileChange}
    id="uploadButton"
    style="visibility: hidden;"
>
<div class="container">
    {#if file_list.length != 0}
        {#each file_list as file, index}
            <div class="itemContainer">
                <a href="{download(index)}">
                    <label for="download{index}" class="inputArea">
                        <img src="{get_thumbnail(index)}" class="thumbnailImage" alt="thumbnail"/>
                        {file.name}
                    </label>               
                </a>
                <button onclick={() => delete_file(index)}>Delete</button>
            </div>
        
        {/each}
    {:else}
        <h1>No files here</h1>
    {/if}
</div>

<div class="spacer">

</div>

<span class="controlBar">

    {#if file == null}
        <label class="inputArea" for="uploadButton">Select File</label>
    {:else}
        <label class="inputArea" for="uploadButton">{file_name}</label>
    {/if}
    <button class="inputArea" onclick={upload}>Upload</button>

</span>

<style>

    .container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        flex: 1;
        flex-wrap: wrap;
        padding: 1em;
        box-sizing: border-box;
        gap: 20px;
        align-items: center;
        justify-content: center;
    }

    .controlBar {
        width: 96vw;
        height: 10vh;
        position: fixed;
        top: 88vh;
        left: 2%;
    }

    .spacer {
        width: 100vw;
        height: 12vh;

    }

    a {
        color: white;
    }

    .itemContainer {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    
    span {
        display: flex;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        box-sizing: border-box;
        gap: 10px;
        justify-content: center;
        align-items: center;
    }

    .thumbnailImage {
        width: 50%;
    }

    .inputArea {
        width: 100%;
        display: flex;
        padding: 1em;
        box-sizing: border-box;
        font-size: 24px;
        background-color: #1a1a1a;
        border-radius: 4px;
        justify-content: center;
        align-items: center;
        outline: none;
        flex-direction: column;
    }

    button {
        width: 100%;
        display: flex;
        padding: 1em;
        box-sizing: border-box;
        font-size: 16px;
        background-color: #1a1a1a;
        border-radius: 4px;
        justify-content: center;
        align-items: center;
        outline: none;
        flex-direction: column;
    }

    button:hover {
        outline: 2px solid var(--main-color);
    }

    .inputArea:hover {
        outline: 2px solid var(--main-color);
    }

    .notification {
        position: fixed;
        width: 60vw;
        transition: 
            transform 750ms ease,
            opacity 500ms ease
        ;
        top: 5vh;
        left: 20vw;
        opacity: 1;
        background-color: #1a1a1a;
        border-radius: 10px;
        border: 2px solid var(--main-color);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        justify-content: center;
        align-items: center;
        padding: 1em;
        gap: 20px;
    }

    .notification h1 {
        font-size: 24px;
    }

    .hidden {
        opacity: 0;
        transform: translateY(-30vh);
    }

    .header {
        width: 100%;
        background-color: var(--main-color);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 10px;
    }

</style>
