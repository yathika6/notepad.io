let notes = JSON.parse(localStorage.getItem('notes')) || [];
let currentNoteId = null;

// Count the number of words and characters
document.getElementById('notepad').addEventListener('input', updateCounts);

function updateCounts() {
    let text = document.getElementById('notepad').innerText;
    document.getElementById('wordCount').innerText = "Words: " + text.split(/\s+/).filter(Boolean).length;
    document.getElementById('charCount').innerText = "Characters: " + text.length;
}

// Save Note
function saveNote() {
    let title = document.getElementById('noteTitle').innerText;
    let content = document.getElementById('notepad').innerText;

    // If there's no current note, create a new note
    if (currentNoteId === null) {
        const newNote = { id: Date.now(), title, content, type: 'text' };
        notes.push(newNote);
    } else {
        // Update the existing note
        notes = notes.map(note => note.id === currentNoteId ? { ...note, title, content } : note);
    }

    localStorage.setItem('notes', JSON.stringify(notes));
    displayNotes();
    clearNote();
}

// Save PDF Note
function savePDFNote() {
    const base64PDF = localStorage.getItem('pdfContent'); // Retrieve the base64 PDF
    if (base64PDF) {
        const title = prompt("Enter a title for the PDF note:"); // Get a title from the user
        if (title) {
            const newNote = { id: Date.now(), title, content: base64PDF, type: 'pdf' };
            notes.push(newNote);
            localStorage.setItem('notes', JSON.stringify(notes));
            displayNotes();
            alert("PDF saved successfully!");
        } else {
            alert("Title is required to save the PDF.");
        }
    } else {
        alert("No PDF content found to save!");
    }
}

// Display Notes in the Saved Notes Section (Bookshelf)
function displayNotes() {
    const savedNotesList = document.getElementById('savedNotesList');
    savedNotesList.innerHTML = '';

    notes.forEach(note => {
        let li = document.createElement('li');
        
        if (note.type === 'pdf') {
            li.innerHTML = `
                <span class="pdf-note" onclick="viewPDF(${note.id})">${note.title} (PDF)</span>
                <a href="${note.content}" download="${note.title}.pdf">Download PDF</a>
                <span class="delete-note" onclick="deleteNote(${note.id})">Delete</span>
            `;
        } else {
            li.innerHTML = `
                <span onclick="loadNote(${note.id})">${note.title}</span>
                <span class="delete-note" onclick="deleteNote(${note.id})">Delete</span>
            `;
        }
        savedNotesList.appendChild(li);
    });
}

// Load Note for Editing
function loadNote(id) {
    const note = notes.find(note => note.id === id);
    if (note) {
        if (note.type === 'pdf') {
            alert("This is a PDF note. You can view it.");
        } else {
            document.getElementById('noteTitle').innerText = note.title; // Set the title
            document.getElementById('notepad').innerText = note.content; // Set the content
            currentNoteId = id; // Set the current note ID for updates
            updateCounts();
        }
    }
}

// View PDF from the Bookshelf
function viewPDF(id) {
    const note = notes.find(note => note.id === id);
    if (note && note.type === 'pdf') {
        localStorage.setItem('pdfContent', note.content);  // Save PDF content to localStorage
        window.location.href = 'view-pdf.html';  // Redirect to the PDF viewer
    }
}

// Delete Note
function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('notes', JSON.stringify(notes));
    displayNotes();
}

// Clear Notepad
function clearNote() {
    document.getElementById('noteTitle').innerText = 'TITLE';
    document.getElementById('notepad').innerText = '';
    currentNoteId = null;
    updateCounts();
}

// Save as Text File
function saveAsText() {
    let text = document.getElementById('notepad').innerText;
    let blob = new Blob([text], { type: 'text/plain' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = document.getElementById('noteTitle').innerText + ".txt";
    link.click();
}

// Save as PDF
function saveAsPDF() {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();
  
    let text = document.getElementById('notepad').innerText;
    let title = document.getElementById('noteTitle').innerText;

    doc.setFont("Courier", "normal");
    doc.setFontSize(12);
  
    doc.text(title, 10, 10);
    let lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 10, 20);

    const pdfBase64 = doc.output('datauristring'); // Get base64 PDF
    localStorage.setItem('pdfContent', pdfBase64); // Store in localStorage
    savePDFNote(); // Call the save PDF note function
}

// Load a text or PDF file from the user's device
async function openFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file.type === "application/pdf") {
        await handlePDFUpload(file);
    } else if (file.type === "text/plain") {
        handleTextUpload(file);
    } else {
        alert("Unsupported file type! Only .txt and .pdf are supported.");
    }
}

// Handle PDF upload and redirect to the view page
async function handlePDFUpload(file) {
    const reader = new FileReader();
    reader.onload = async function (e) {
        const pdfData = e.target.result;

        // Store the PDF in localStorage for viewing on the next page as base64
        const base64PDF = await convertToBase64(file);
        localStorage.setItem('pdfContent', base64PDF);

        // Redirect to the PDF viewer page
        window.location.href = 'view-pdf.html';
    };
    reader.readAsArrayBuffer(file);  // Read the PDF file as binary
}

// Handle text file upload
function handleTextUpload(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('notepad').innerText = e.target.result;
        document.getElementById('noteTitle').innerText = file.name.replace('.txt', '');
        currentNoteId = null; // Reset current note ID since it's a new file
    };
    reader.readAsText(file);
}

// Convert PDF file to base64 for viewing
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Toggle Read-Only Mode
let isReadOnly = false;

function toggleReadOnly() {
    isReadOnly = !isReadOnly;
    document.getElementById('notepad').contentEditable = !isReadOnly;
    document.getElementById('noteTitle').contentEditable = !isReadOnly;
    document.getElementById('toggleReadOnly').innerText = isReadOnly ? 'Editable' : 'Read-Only';
}

// Load saved notes on page load
window.onload = function() {
    displayNotes();
};

// Toggle Bookshelf visibility
function toggleBookshelf() {
    const bookshelf = document.getElementById('bookshelf');
    const notepadContainer = document.querySelector('.notepad-container');
    const toggleButton = document.getElementById('toggleButton');
    const bookshelfTitle = document.getElementById('bookshelfTitle');
    const savedNotesList = document.getElementById('savedNotesList');

    if (bookshelf.style.width === '0px' || bookshelf.style.width === '') {
        bookshelf.style.width = '200px'; // Expand bookshelf
        notepadContainer.style.width = 'calc(100% - 200px)'; // Adjust notepad width
        toggleButton.innerText = '◀'; // Change button to collapse
        // Show saved notes
        savedNotesList.classList.remove('hidden');
        savedNotesList.classList.add('visible');

        bookshelfTitle.style.transform = 'rotate(-90deg)';
    } else {
        bookshelf.style.width = '0px'; // Collapse bookshelf
        notepadContainer.style.width = '100%'; // Full width for notepad
        toggleButton.innerText = '▶'; // Change button to expand

        // Hide saved notes
        savedNotesList.classList.remove('visible');
        savedNotesList.classList.add('hidden');

        bookshelfTitle.style.transform = 'rotate(180deg)';
    }
}

async function loadPDFForEditing(id) {
    const note = notes.find(note => note.id === id);
    if (note && note.type === 'pdf') {
        // Use pdf.js to extract the text from the PDF content
        const pdfData = atob(note.content.split(',')[1]);  // Remove base64 header
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        
        loadingTask.promise.then(async function(pdf) {
            let fullText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Concatenate all text items into one string
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';  // Add newline for each page
            }
            
            // Load the extracted text into the notepad
            document.getElementById('noteTitle').innerText = note.title;
            document.getElementById('notepad').innerText = fullText;
            currentNoteId = id;
            updateCounts();
        }).catch(function(error) {
            console.error('Error extracting text from PDF:', error);
            alert('Unable to load PDF for editing.');
        });
    }
}

function saveEditedPDF() {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();
  
    let text = document.getElementById('notepad').innerText;
    let title = document.getElementById('noteTitle').innerText;

    doc.setFont("Courier", "normal");
    doc.setFontSize(12);
  
    doc.text(title, 10, 10);
    let lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 10, 20);

    const updatedPdfBase64 = doc.output('datauristring');  // Get the new base64 PDF
    localStorage.setItem('pdfContent', updatedPdfBase64);  // Store the new PDF

    // Update the note in localStorage
    notes = notes.map(note => 
        note.id === currentNoteId ? { ...note, content: updatedPdfBase64, type: 'pdf' } : note
    );
    localStorage.setItem('notes', JSON.stringify(notes));

    alert('PDF updated successfully!');
}
