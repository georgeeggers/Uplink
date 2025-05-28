<script lang='ts'>
    import { pb } from '../pocketbase.svelte'
    import { ClientResponseError } from 'pocketbase';
    import { onMount, onDestroy } from "svelte";
    import QRCode from 'qrcode';

    let file = $state(null);
    let file_name = $state("None");
    let visibility = $state("hidden");
    let announce_header = $state("");
    let announce_body = $state("");
    let announce_upload = $state(false)
    let icon_size = $state(256);
    let qrcode_url = $state("");
    let qr_vis = $state("hidden");
    let readable_url = $state("")

    async function handleFileChange(e){ 
        for(let f of e.target.files){
            console.log(f);
            file = f;
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
            await upload();
        }

    };
    let file_list = $state([]);

    const download = (index) => {
        const url = pb.files.getURL(file_list[index], file_list[index].data) + "?download=1";
        return url
    }

    const get_thumbnail = (index) => {
        let extensions = file_list[index].name.split(".");
        let extension = extensions[extensions.length - 1];
        if(extension == "png" || extension == "jpg" || extension == "jpeg" || extension == "gif" || extension == "webp"){
            console.log("returning thumb")
            return pb.files.getURL(file_list[index], file_list[index].data, { 'thumb': '256x256'} );
        } else {
           return "null"; 
        }
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

            const upload = await pb.collection('Files').create(data);
            if(upload){
                console.log("File Uploaded");
            }
            file = null;
            file_name = "None";
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
        const response = await pb.collection("Files").getFullList({
            sort: '-created',
        });
        file_list = response;
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

    const createCode = (index) => {
        console.log("BLAHHH");
        let data = "";
        readable_url = download(index);
        const image = QRCode.toDataURL(readable_url, { errorCorrectionLevel: 'L' }, function (err, url) {
            data = url;
        });

        const bytes = atob(data.split(',')[1]);
        const byteArray1 = [];
        for (let i = 0; i < bytes.length; i++) {
            const byte = bytes.charCodeAt(i);
            byteArray1.push(byte);
        }
        const byteArray = new Uint8Array(byteArray1);
        const blob = new Blob([byteArray], { type: "image/png" });
        qrcode_url = URL.createObjectURL(blob);
        qr_vis = "";
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
    multiple
    onchange={handleFileChange}
    id="uploadButton"
    style="visibility: hidden;"
>

<div class="container">
    {#if file_list.length != 0}
        {#if icon_size >= 64}
            {#each file_list as file, index}
                <div class="itemContainer">
                    <div class="imageContainer">
                        {#if get_thumbnail(index) != "null"}
                        <img src="{get_thumbnail(index)}" class="thumbnailImage" style="width: {icon_size}px;" alt="thumbnail"/>
                        {:else}
                        <img src="src\assets\icons8-file-250.png" class="thumbnailImage" style="width: {icon_size}px;" alt="thumbnail" />
                        {/if}
                        {file.name}
                    </div>
                    <div class="controlContainer">
                        <button onclick={() => createCode(index)} class="iconButton icon">N</button>
                        <button onclick={() => {window.location.href=download(index)}} class="iconButton icon">|</button>
                        <button class="iconButton icon" onclick={() => delete_file(index)}>U</button>   
                    </div>
                </div>
            
            {/each}
        {:else}
            {#each file_list as file, index}
                <div class="itemContainer" style="flex-direction: row; padding: 10px; width: 100%;">
                    <div class="imageContainer" style="width: 70%;">
                        {file.name}
                    </div>
                    <div class="controlContainer" style="width: 30%;">
                        <button onclick={() => createCode(index)} class="iconButton icon">N</button>
                        <button onclick={() => {window.location.href=download(index)}} class="iconButton icon">|</button>
                        <button class="iconButton icon" onclick={() => delete_file(index)}>U</button>   
                    </div>
                </div>
            
            {/each}
        {/if}
    {:else}
        <h1>No files here</h1>
    {/if}
</div>

<div class="spacer">

</div>

<span class="controlBar">
    <label class="inputArea" style="flex-direction: row;" for="uploadButton"><i class="icon">^</i> Upload</label>
    <input
        type="range"
        bind:value={icon_size}
        min=0
        max=256
        step=64
    >
</span>

<label for="close" class="blocker {qr_vis}"></label>
<div class="announcer {qr_vis}">
    <span style="width: 100%; height: 20%;">
        <span class="inputArea" style="width: 100%; height: 100%;">
            <textarea
            
                bind:value={readable_url}
                readonly
            
            ></textarea>
        </span>

        <button id="close" onclick={() => {qr_vis = 'hidden'}} style="visibility: hidden; position: fixed;">X</button>
    </span>


    <img src="{qrcode_url}" alt="QRCode" class="qr">
</div>

<style>

    @font-face {
        font-family: "icon";
        src: url('byom_icons/Byom-Icons-Trial.ttf');
    }

    .announcer.hidden {
        transform: translateY(-100vh);
        opacity: 0;
    }

    .qr {
        max-width: min(60vw, 60vh);
        display: flex;
    }

    .icon {
        font-family: "icon";
    }

    .announcer {
        width: 80%;
        height: 80%;
        position: fixed;
        left: 10%;
        top: 10%;
        background-color: var(--main-color);
        border-radius: 24px;
        opacity: 1;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        align-items: center;
        justify-content: center;
        padding: 1em;
        gap: 20px;
        transition:
            transform 1s ease,
            opacity 1s ease
        ;
        z-index: 100;
    }

    .announcer img {
        width: 75%;
        border-radius: 10px;
    }

    textarea {
        width: 100%;
        height: 100%;
        resize: none;
        background-color: #1a1a1a;
        border: none;
        font-size: 24px;
        scrollbar-width: 10px;
    }

    .blocker {
        width: 100%;
        height: 100%;
        position: fixed;
        left: 0%;
        top: 0%;
        background-color: black;
        opacity: .8;
        z-index: 99;
        transition:
            opacity 1s ease
        ;
    }

    .blocker.hidden {
        scale: 0;
        opacity: 0;
    }

    .controlContainer {
        justify-content: center;
        width: 100%;
        box-sizing: border-box;
        align-items: center;
        flex-direction: row;
        display: flex;
        gap: 10px;
        padding-left: 1em;
        padding-right: 1em;
    }

    .iconButton {
        justify-content: center;
        font-size: 28px;
        align-items: center;
        display: flex;
        box-sizing: border-box;
        color: var(--main-color);
        background: transparent;
        padding: 0xp;
        transition:
            color 250ms ease
        ;
    }

    button:hover {
        color: white;
    }

    .imageContainer {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 5px;
        padding: 1em;
    }

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

    .itemContainer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #2f2f2f;
        padding-bottom: 2em;
        border-radius: 24px;
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
        border-radius: 10px;
    }

    .inputArea {
        display: flex;
        width: 100%;
        height: 100%;
        padding: 1em;
        box-sizing: border-box;
        font-size: 24px;
        border-radius: 24px;
        background-color: #1a1a1a;
        justify-content: center;
        align-items: center;
        outline: none;
        color: var(--main-color);
        flex-direction: column;
        border: 1px solid transparent;
        transition:
            outline 100ms ease,
            color 250ms ease
        ;
    }

    .inputArea:hover {
        color: white;
    }

    button {
        width: 100%;
        display: flex;
        box-sizing: border-box;
        font-size: 16px;
        background-color: #1a1a1a;
        border-radius: 4px;
        justify-content: center;
        align-items: center;
        outline: none;
        flex-direction: column;
        border: 1px solid transparent;
        color: var(--main-color);
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
