class DropBoxController{
    constructor(){
        
        this.initElements()
        this.initEvents()
        this.customizedEvents()
        this.initFireBase()
        this.readFiles()

    }

    initElements(){

        this.btnSendFileEl = document.querySelector('#btn-send-file')
        this.btnNewFolderEl = document.querySelector("#btn-new-folder")
        this.btnRenameEl = document.querySelector("#btn-rename")
        this.btnDeleteEl = document.querySelector("#btn-delete")
        this.inputFileEl = document.querySelector("#files")
        this.snackBarEl = document.querySelector("#react-snackbar-root")
        this.progressBarEl = this.snackBarEl.querySelector(".mc-progress-bar-fg")
        this.snackBarfileNameEl = this.snackBarEl.querySelector(".filename")
        this.snackBarPercentProgressEl = this.snackBarEl.querySelector(".percent-progress")
        this.snackBarTimeLeft = this.snackBarEl.querySelector(".timeleft")
        this.listFilesEl = document.querySelector("#list-of-files-and-directories")

    }

    customizedEvents(){
        this.onselectionchange = new Event('onselectionchange')
    }

    initFireBase(){
        var firebaseConfig = {
            apiKey: "AIzaSyAuP9_1TPkc4Z2bIhKrsJj4v04ychCw3aA",
            authDomain: "dropboxclone-javascript.firebaseapp.com",
            databaseURL: "https://dropboxclone-javascript-default-rtdb.firebaseio.com",
            projectId: "dropboxclone-javascript",
            storageBucket: "dropboxclone-javascript.appspot.com",
            messagingSenderId: "765274120235",
            appId: "1:765274120235:web:bcab4a207b3c4b93698a6e"
        };

        firebase.initializeApp(firebaseConfig)
    }

    getFirebaseRef(){
        return firebase.database().ref('/files')
    }

    getFilesSelection(){
        return this.listFilesEl.querySelectorAll('.selected')
    }

    initEvents(){

        this.btnRenameEl.addEventListener('click', e => {
            var file = JSON.parse(this.getFilesSelection()[0].dataset.file)

            var newName = prompt("Enter the new name:", file.name)

            if(newName){

                var key = this.getFilesSelection()[0].dataset.key

                file.name = newName

                this.getFirebaseRef().child(key).set(file)
            }

        })

        this.btnSendFileEl.addEventListener('click', event => {
            this.inputFileEl.style.display = "block"
        })

        this.btnDeleteEl.addEventListener('click', event => {
            var files = Array.from(this.getFilesSelection())


            this.deleteFiles(files).then(resp => {
                resp.forEach( r => {
                    this.getFirebaseRef().child(r.key).remove()
                })
            }).catch(error => {
                console.log(error)
            })

        })

        this.inputFileEl.addEventListener('change', event => {

            this.inputFileEl.style.display = "none"
            this.snackBarEl.style.display = "block"

            this.sendFiles(event.target.files)
            .then( files => {
                files.forEach(file => {
                    this.getFirebaseRef().push().set(file.files['input-file'])
                })
                setTimeout(() => this.initialState(), 2000)
            })
            .catch(error => {
                console.log(error)
            })
        })

        this.listFilesEl.addEventListener('onselectionchange', event => {

            var selectedFiles = this.getFilesSelection().length

            if(selectedFiles === 1){
                this.btnDeleteEl.style.display = "block"
                this.btnRenameEl.style.display = "block"
            }else if(selectedFiles > 1){
                this.btnRenameEl.style.display = "none"
            }else{
                this.btnDeleteEl.style.display = "none"
                this.btnRenameEl.style.display = "none"
            }
        })
    }

    initialState(){
        this.btnSendFileEl.disabled = false
        this.inputFileEl.style.display = "none"
        this.snackBarEl.style.display = "none"
        this.inputFileEl.value = ""
    }

    ajax(url, method = "GET", data, onprogress = function(){}, onload = function(){}){
        
        var ajax = new XMLHttpRequest()

        ajax.open(method, url)

        ajax.onprogress = event => onprogress(event)

        ajax.onload = () => {
            onload(ajax)
        }

        // Deleting a file, the data will be the path of the file in string mode

        if(typeof data == 'string'){
            ajax.setRequestHeader('Content-Type', 'application/json');
            ajax.send(JSON.stringify({filePath: data}))
        }

        // Uploading a file, the data will be a formdata of the file

        if(typeof data == 'object'){
            ajax.send(data)
        }
    }

    deleteFiles(files){
        var promises = []

        files.forEach(file => {
            promises.push(new Promise((resolve, reject) => {
                var key = file.dataset.key
                var filePath = (JSON.parse(file.dataset.file)).path

                var onprogress = () => {}

                var onload = (ajax) => {
                    try{
                        resolve(JSON.parse(ajax.responseText))
                    }catch(error){
                        console.log('1')
                        reject(error)
                    }
                }

                this.ajax('/deletefiles', 'DELETE', filePath, () => {

                }, (ajax) => {
                    try{
                        if(ajax.status == 404){
                            reject("File not found.")
                        }

                        resolve({ key })
                    }catch(error){
                        reject(error)
                    }
                })
            }))
        })

        return Promise.all(promises)
    }

    sendFiles(files){
        var groupedFiles = [...files]

        var promises = []

        groupedFiles.forEach(file => {

            let formdata = new FormData()

            formdata.append('input-file', file)

            promises.push(new Promise((resolve, reject) => {
                this.ajax('/uploads', 'POST', formdata, (event) => {
                    var startTime = new Date()
                    this.btnSendFileEl.disabled = true
                    this.calculateProgressBar(event.loaded, event.total)
                    this.changeSnackbarTitle(file.name)
                    this.calculateTimeRemaining(startTime, event.loaded, event.total - event.loaded)
                }, (ajax) => {
                    try{
                        resolve(JSON.parse(ajax.responseText)) 
                    }catch(error){
                        reject(error)
                    }
                })
            }))
        })

        return Promise.all(promises)
    }

    calculateProgressBar(loaded, total){
        var percent = parseInt((100 * loaded) / total)
        this.progressBarEl.style.width = `${percent}%`
        this.snackBarTimeLeft.innerHTML = `${percent}%`
    }

    changeSnackbarTitle(name){
        this.snackBarfileNameEl.innerHTML = name
    }

    calculateTimeRemaining(startTime, loaded, remaining){
        var timeSpent = new Date() - startTime
        var remainingTime = parseInt((timeSpent * remaining) / loaded)
        this.snackBarPercentProgressEl.innerHTML = this.timeConverter(remainingTime)
    }

    timeConverter(milliseconds){
        var second = parseInt(milliseconds / 1000) > 1 ? parseInt(milliseconds / 1000) : null
        var minute = parseInt(second / 60) > 1 ? parseInt(second / 60) : null
        var hour = parseInt(minute / 60) > 1 ? parseInt(minute / 60) : null

        second = second % 60
        minute = minute % 60
        hour = hour % 24

        if(hour){
            return `remaining time - ${hour} hours, ${minute} minutes, and ${second} seconds.`
        }

        if(minute){
            return `remaining time - ${minute} minutes, and ${second} seconds.`
        }

        if(second){
            return `remaining time - ${second} seconds.`
        }

        return `remaining time - 0 seconds.`
        
    }

    getFileIcon(type){
        switch(type){
            case 'folder':
                return `
                <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                    <title>content-folder-large</title>
                    <g fill="none" fill-rule="evenodd">
                        <path d="M77.955 53h50.04A3.002 3.002 0 0 1 131 56.007v58.988a4.008 4.008 0 0 1-4.003 4.005H39.003A4.002 4.002 0 0 1 35 114.995V45.99c0-2.206 1.79-3.99 3.997-3.99h26.002c1.666 0 3.667 1.166 4.49 2.605l3.341 5.848s1.281 2.544 5.12 2.544l.005.003z" fill="#71B9F4"></path>
                        <path d="M77.955 52h50.04A3.002 3.002 0 0 1 131 55.007v58.988a4.008 4.008 0 0 1-4.003 4.005H39.003A4.002 4.002 0 0 1 35 113.995V44.99c0-2.206 1.79-3.99 3.997-3.99h26.002c1.666 0 3.667 1.166 4.49 2.605l3.341 5.848s1.281 2.544 5.12 2.544l.005.003z" fill="#92CEFF"></path>
                    </g>
                </svg>
                `
            break;
            
            case 'image/jpeg':
            case 'image/jpg':
            case 'image/gif':
                return `
                <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="160px" height="160px" viewBox="0 0 160 160" enable-background="new 0 0 160 160" xml:space="preserve">
                    <filter height="102%" width="101.4%" id="mc-content-unknown-large-a" filterUnits="objectBoundingBox" y="-.5%" x="-.7%">
                        <feOffset result="shadowOffsetOuter1" in="SourceAlpha" dy="1"></feOffset>
                        <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1">
                        </feColorMatrix>
                    </filter>
                    <title>Image</title>
                    <g>
                        <g>
                            <g filter="url(#mc-content-unknown-large-a)">
                                <path id="mc-content-unknown-large-b_2_" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47c-2.209,0-4-1.791-4-4V34
                                        C43,31.791,44.791,30,47,30z"></path>
                            </g>
                            <g>
                                <path id="mc-content-unknown-large-b_1_" fill="#F7F9FA" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47
                                        c-2.209,0-4-1.791-4-4V34C43,31.791,44.791,30,47,30z"></path>
                            </g>
                        </g>
                    </g>
                    <g>
                        <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M81.148,62.638c8.086,0,16.173-0.001,24.259,0.001
                                c1.792,0,2.3,0.503,2.301,2.28c0.001,11.414,0.001,22.829,0,34.243c0,1.775-0.53,2.32-2.289,2.32
                                c-16.209,0.003-32.417,0.003-48.626,0c-1.775,0-2.317-0.542-2.318-2.306c-0.002-11.414-0.003-22.829,0-34.243
                                c0-1.769,0.532-2.294,2.306-2.294C64.903,62.637,73.026,62.638,81.148,62.638z M81.115,97.911c7.337,0,14.673-0.016,22.009,0.021
                                c0.856,0.005,1.045-0.238,1.042-1.062c-0.028-9.877-0.03-19.754,0.002-29.63c0.003-0.9-0.257-1.114-1.134-1.112
                                c-14.637,0.027-29.273,0.025-43.91,0.003c-0.801-0.001-1.09,0.141-1.086,1.033c0.036,9.913,0.036,19.826,0,29.738
                                c-0.003,0.878,0.268,1.03,1.069,1.027C66.443,97.898,73.779,97.911,81.115,97.911z"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M77.737,85.036c3.505-2.455,7.213-4.083,11.161-5.165
                                c4.144-1.135,8.364-1.504,12.651-1.116c0.64,0.058,0.835,0.257,0.831,0.902c-0.024,5.191-0.024,10.381,0.001,15.572
                                c0.003,0.631-0.206,0.76-0.789,0.756c-3.688-0.024-7.375-0.009-11.062-0.018c-0.33-0.001-0.67,0.106-0.918-0.33
                                c-2.487-4.379-6.362-7.275-10.562-9.819C78.656,85.579,78.257,85.345,77.737,85.036z"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M87.313,95.973c-0.538,0-0.815,0-1.094,0
                                c-8.477,0-16.953-0.012-25.43,0.021c-0.794,0.003-1.01-0.176-0.998-0.988c0.051-3.396,0.026-6.795,0.017-10.193
                                c-0.001-0.497-0.042-0.847,0.693-0.839c6.389,0.065,12.483,1.296,18.093,4.476C81.915,90.33,84.829,92.695,87.313,95.973z"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M74.188,76.557c0.01,2.266-1.932,4.223-4.221,4.255
                                c-2.309,0.033-4.344-1.984-4.313-4.276c0.03-2.263,2.016-4.213,4.281-4.206C72.207,72.338,74.179,74.298,74.188,76.557z"></path>
                    </g>
                </svg>
                `
            break;

            case 'application/pdf':
                return `
                <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="160px" height="160px" viewBox="0 0 160 160" enable-background="new 0 0 160 160" xml:space="preserve">
                    <filter height="102%" width="101.4%" id="mc-content-unknown-large-a" filterUnits="objectBoundingBox" y="-.5%" x="-.7%">
                        <feOffset result="shadowOffsetOuter1" in="SourceAlpha" dy="1"></feOffset>
                        <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1">
                        </feColorMatrix>
                    </filter>
                    <title>PDF</title>
                    <g>
                        <g>
                            <g filter="url(#mc-content-unknown-large-a)">
                                <path id="mc-content-unknown-large-b_2_" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47c-2.209,0-4-1.791-4-4V34
                                        C43,31.791,44.791,30,47,30z"></path>
                            </g>
                            <g>
                                <path id="mc-content-unknown-large-b_1_" fill="#F7F9FA" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47
                                        c-2.209,0-4-1.791-4-4V34C43,31.791,44.791,30,47,30z"></path>
                            </g>
                        </g>
                    </g>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#F15124" d="M102.482,91.479c-0.733-3.055-3.12-4.025-5.954-4.437
                            c-2.08-0.302-4.735,1.019-6.154-0.883c-2.167-2.905-4.015-6.144-5.428-9.482c-1.017-2.402,1.516-4.188,2.394-6.263
                            c1.943-4.595,0.738-7.984-3.519-9.021c-2.597-0.632-5.045-0.13-6.849,1.918c-2.266,2.574-1.215,5.258,0.095,7.878
                            c3.563,7.127-1.046,15.324-8.885,15.826c-3.794,0.243-6.93,1.297-7.183,5.84c0.494,3.255,1.988,5.797,5.14,6.825
                            c3.062,1,4.941-0.976,6.664-3.186c1.391-1.782,1.572-4.905,4.104-5.291c3.25-0.497,6.677-0.464,9.942-0.025
                            c2.361,0.318,2.556,3.209,3.774,4.9c2.97,4.122,6.014,5.029,9.126,2.415C101.895,96.694,103.179,94.38,102.482,91.479z
                            M67.667,94.885c-1.16-0.312-1.621-0.97-1.607-1.861c0.018-1.199,1.032-1.121,1.805-1.132c0.557-0.008,1.486-0.198,1.4,0.827
                            C69.173,93.804,68.363,94.401,67.667,94.885z M82.146,65.949c1.331,0.02,1.774,0.715,1.234,1.944
                            c-0.319,0.725-0.457,1.663-1.577,1.651c-1.03-0.498-1.314-1.528-1.409-2.456C80.276,65.923,81.341,65.938,82.146,65.949z
                            M81.955,86.183c-0.912,0.01-2.209,0.098-1.733-1.421c0.264-0.841,0.955-2.04,1.622-2.162c1.411-0.259,1.409,1.421,2.049,2.186
                            C84.057,86.456,82.837,86.174,81.955,86.183z M96.229,94.8c-1.14-0.082-1.692-1.111-1.785-2.033
                            c-0.131-1.296,1.072-0.867,1.753-0.876c0.796-0.011,1.668,0.118,1.588,1.293C97.394,93.857,97.226,94.871,96.229,94.8z"></path>
                </svg>
                `
            break;

            case 'audio/aac':
            case 'audio/midi':
            case 'audio/ogg':
            case 'audio/mpeg':
            case 'audio/x-wav':
                return `
                <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                    <title>content-audio-large</title>
                    <defs>
                        <rect id="mc-content-audio-large-b" x="30" y="43" width="100" height="74" rx="4"></rect>
                        <filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-audio-large-a">
                            <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                            <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                        </filter>
                    </defs>
                    <g fill="none" fill-rule="evenodd">
                        <g>
                            <use fill="#000" filter="url(#mc-content-audio-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use>
                            <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use>
                        </g>
                        <path d="M67 60c0-1.657 1.347-3 3-3 1.657 0 3 1.352 3 3v40c0 1.657-1.347 3-3 3-1.657 0-3-1.352-3-3V60zM57 78c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm40 0c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm-20-5.006A3 3 0 0 1 80 70c1.657 0 3 1.343 3 2.994v14.012A3 3 0 0 1 80 90c-1.657 0-3-1.343-3-2.994V72.994zM87 68c0-1.657 1.347-3 3-3 1.657 0 3 1.347 3 3v24c0 1.657-1.347 3-3 3-1.657 0-3-1.347-3-3V68z" fill="#637282"></path>
                    </g>
                </svg>
                `
            break;

            case 'video/webm':
            case 'video/3gpp':
                return `
                <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                    <title>content-video-large</title>
                    <defs>
                        <rect id="mc-content-video-large-b" x="30" y="43" width="100" height="74" rx="4"></rect>
                        <filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-video-large-a">
                            <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                            <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                        </filter>
                    </defs>
                    <g fill="none" fill-rule="evenodd">
                        <g>
                            <use fill="#000" filter="url(#mc-content-video-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use>
                            <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use>
                        </g>
                        <path d="M69 67.991c0-1.1.808-1.587 1.794-1.094l24.412 12.206c.99.495.986 1.3 0 1.794L70.794 93.103c-.99.495-1.794-.003-1.794-1.094V67.99z" fill="#637282"></path>
                    </g>
                </svg>
                `
            break;

            default:
                return `
                <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                    <title>1357054_617b.jpg</title>
                    <defs>
                        <rect id="mc-content-unknown-large-b" x="43" y="30" width="74" height="100" rx="4"></rect>
                        <filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-unknown-large-a">
                            <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                            <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                        </filter>
                    </defs>
                    <g fill="none" fill-rule="evenodd">
                        <g>
                            <use fill="#000" filter="url(#mc-content-unknown-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                            <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                        </g>
                    </g>
                </svg>
                `
        }
    }

    getFileView(file, key){
        var li = document.createElement("li")

        li.innerHTML = ''

        li.innerHTML = 
        `
        ${this.getFileIcon(file.type)}
        <div class="name text-center" id="file-name">${file.name}</div>
        `

        li.dataset.key = key
        li.dataset.file = JSON.stringify(file)

        li.addEventListener('click', e => {
            var items = Array.from(this.listFilesEl.children)

            if(li.classList.contains('selected')){
                li.classList.toggle('selected')
            }else{
                if(e.ctrlKey){
                    this.ctrlSelectionFiles(li)
                }else if(e.shiftKey){
                    this.shiftSelectionFiles(items, li)
                }else{
                    this.singleSelection(items, li)
                }
            }

            this.listFilesEl.dispatchEvent(this.onselectionchange)
        })

        return li
    }

    shiftSelectionFiles(items, li){
        var initialIndex = 0
        for(var index in items){
            if(items[index].classList.contains('selected')){
                initialIndex = index
            }
        }

        li.classList.toggle('selected')

        var parent = li.parentNode

        var finalIndex = Array.prototype.indexOf.call(parent.children, li)

        var distance = Math.abs(initialIndex - finalIndex)

        if(distance > 1){
            if(initialIndex > finalIndex){
                Array.from(this.listFilesEl.children).forEach( element => {
                    var index = Array.prototype.indexOf.call(element.parentNode.children, element)
                    if( index > finalIndex && index < initialIndex){
                        element.classList.toggle('selected')
                    }
                })
            }else{
                Array.from(this.listFilesEl.children).forEach( element => {
                    var index = Array.prototype.indexOf.call(element.parentNode.children, element)
                    if( index > initialIndex && index < finalIndex){
                        element.classList.toggle('selected')
                    }
                })
            }
        }
    }

    ctrlSelectionFiles(li){
        li.classList.toggle('selected')
    }

    singleSelection(items, li){
        items.forEach(element => {
            if(element.classList.contains('selected')){
                element.classList.toggle('selected')
            }
        })
        li.classList.toggle('selected')
    }

    readFiles(){
        this.getFirebaseRef().on('value', data => {
            var files = data.val()

            this.listFilesEl.innerHTML = ""

            for(var index in files){
                var file = files[index]
                var key = index

                this.listFilesEl.appendChild(this.getFileView(file, key))
            }

        })
    }
}
