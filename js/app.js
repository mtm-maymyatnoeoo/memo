import { supabase } from "./supabase.js";

// ==========================================
// Configuration
// ==========================================

const STORAGE_BUCKET = "memo-images";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


// ==========================================
// State
// ==========================================

let memos = [];

let memoToDelete = null;

let existingImages = [];

let selectedImages = [];


// ==========================================
// Bootstrap Modals
// ==========================================

const memoModalElement =
    document.getElementById("memoModal");

const deleteModalElement =
    document.getElementById("deleteModal");

const memoModal =
    bootstrap.Modal.getOrCreateInstance(
        memoModalElement
    );

const deleteModal =
    bootstrap.Modal.getOrCreateInstance(
        deleteModalElement
    );


// ==========================================
// DOM Elements
// ==========================================

const memoList =
    document.getElementById("memoList");

const emptyState =
    document.getElementById("emptyState");

const memoCount =
    document.getElementById("memoCount");

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const sortSelect =
    document.getElementById("sortSelect");

const memoForm =
    document.getElementById("memoForm");

const memoId =
    document.getElementById("memoId");

const memoTitle =
    document.getElementById("memoTitle");

const memoContent =
    document.getElementById("memoContent");

const memoCategory =
    document.getElementById("memoCategory");

const memoPinned =
    document.getElementById("memoPinned");

const memoModalLabel =
    document.getElementById("memoModalLabel");

const confirmDeleteButton =
    document.getElementById("confirmDeleteButton");

const themeButton =
    document.getElementById("themeButton");

const memoImages =
    document.getElementById("memoImages");

const imagePreview =
    document.getElementById("imagePreview");

const viewMemoModalElement =
    document.getElementById("viewMemoModal");

const viewMemoModal =
    bootstrap.Modal.getOrCreateInstance(
        viewMemoModalElement
    );

const imageViewerModalElement =
    document.getElementById("imageViewerModal");

const imageViewerModal =
    bootstrap.Modal.getOrCreateInstance(
        imageViewerModalElement
    );

const viewMemoTitle =
    document.getElementById("viewMemoTitle");

const viewMemoContent =
    document.getElementById("viewMemoContent");

const viewMemoCategory =
    document.getElementById("viewMemoCategory");

const viewMemoDate =
    document.getElementById("viewMemoDate");

const viewMemoPinned =
    document.getElementById("viewMemoPinned");

const viewMemoImages =
    document.getElementById("viewMemoImages");

const viewMemoEditButton =
    document.getElementById("viewMemoEditButton");

const viewerImage =
    document.getElementById("viewerImage");
// ==========================================
// Utility
// ==========================================

function showLoading() {
    memoList.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">
                    Loading...
                </span>
            </div>

            <p class="mt-3 text-body-secondary">
                Loading memos...
            </p>
        </div>
    `;
}

function showError(message) {
    console.error(message);

    showToast(
        message || "Something went wrong."
    );
}

function escapeHtml(value) {
    const div =
        document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================
// Load Memos
// ==========================================

async function loadMemos() {

    showLoading();

    const { data, error } =
        await supabase
            .from("memos")
            .select(`
                *,
                memo_images (
                    id,
                    storage_path,
                    file_name,
                    created_at
                )
            `)
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );

    if (error) {
        console.error(
            "Failed to load memos:",
            error
        );

        showError(
            "Failed to load memos."
        );

        memos = [];

        renderMemos();

        return;
    }

    memos = data || [];

    renderMemos();
}


// ==========================================
// Render Memos
// ==========================================

function renderMemos() {

    const searchKeyword =
        searchInput.value
            .trim()
            .toLowerCase();

    const selectedCategory =
        categoryFilter.value;

    const sortType =
        sortSelect.value;


    // ======================================
    // Filter
    // ======================================

    let filteredMemos =
        memos.filter((memo) => {

            const title =
                (memo.title || "")
                    .toLowerCase();

            const content =
                (memo.content || "")
                    .toLowerCase();

            const category =
                (memo.category || "")
                    .toLowerCase();

            const matchesSearch =
                title.includes(searchKeyword) ||
                content.includes(searchKeyword) ||
                category.includes(searchKeyword);

            const matchesCategory =
                selectedCategory === "all" ||
                memo.category === selectedCategory;

            return (
                matchesSearch &&
                matchesCategory
            );
        });


    // ======================================
    // Sort
    // ======================================

    filteredMemos =
        sortMemos(
            filteredMemos,
            sortType
        );


    // ======================================
    // Clear
    // ======================================

    memoList.innerHTML = "";


    // ======================================
    // Count
    // ======================================

    memoCount.textContent =
        `${filteredMemos.length} ${
            filteredMemos.length === 1
                ? "memo"
                : "memos"
        }`;


    // ======================================
    // Empty
    // ======================================

    if (filteredMemos.length === 0) {

        emptyState.classList.remove(
            "d-none"
        );

        return;
    }

    emptyState.classList.add(
        "d-none"
    );


    // ======================================
    // Cards
    // ======================================

    filteredMemos.forEach((memo) => {

        const card =
            createMemoCard(memo);

        memoList.appendChild(card);
    });
}


// ==========================================
// Create Memo Card
// ==========================================



function createMemoCard(memo) {

    // Bootstrap column wrapper
    const column = document.createElement("div");

    column.className =
        "col-12 col-md-6 col-lg-4";


    const pinIcon =
        memo.is_pinned
            ? `
                <i
                    class="bi bi-pin-angle-fill text-primary me-1"
                    aria-hidden="true"
                ></i>
            `
            : "";


    let imageHtml = "";


    if (
        memo.memo_images &&
        memo.memo_images.length > 0
    ) {

        const firstImage =
            memo.memo_images[0];

        const imageUrl =
            getPublicImageUrl(
                firstImage.storage_path
            );


        imageHtml = `
            <div class="mb-3">

                <img
                    src="${imageUrl}"
                    class="img-fluid rounded memo-card-image"
                    alt="${escapeHtml(
                        firstImage.file_name
                    )}"
                >

            </div>
        `;
    }


    // Create actual card
    const card =
        document.createElement("div");

    card.className =
        "card memo-card h-100";


    card.innerHTML = `

        <div class="card-body">

            <div
                class="
                    d-flex
                    justify-content-between
                    gap-3
                "
            >

                <div class="flex-grow-1">

                    ${imageHtml}


                    <h5
                        class="
                            card-title
                            memo-title
                            mb-2
                        "
                    >

                        ${pinIcon}

                        ${escapeHtml(
                            memo.title
                        )}

                    </h5>


                    <p
                        class="
                            card-text
                            text-body-secondary
                            memo-content
                            mb-3
                        "
                    >
                        ${escapeHtml(
                            memo.content || ""
                        )}
                    </p>


                    <div
                        class="
                            d-flex
                            flex-wrap
                            align-items-center
                            gap-2
                        "
                    >

                        <span class="badge bg-secondary">

                            ${escapeHtml(
                                memo.category || "Other"
                            )}

                        </span>


                        ${
                            memo.memo_images?.length
                                ? `
                                    <span
                                        class="
                                            badge
                                            bg-info
                                        "
                                    >

                                        <i
                                            class="bi bi-image"
                                        ></i>

                                        ${
                                            memo.memo_images.length
                                        }

                                    </span>
                                `
                                : ""
                        }


                        <small
                            class="text-body-secondary"
                        >
                            ${formatDate(
                                memo.updated_at
                            )}
                        </small>

                    </div>

                </div>


                <!-- Actions -->
                <div class="dropdown flex-shrink-0">

                    <button
                        class="
                            btn
                            btn-sm
                            btn-outline-secondary
                        "
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-label="Memo actions"
                    >

                        <i
                            class="
                                bi
                                bi-three-dots-vertical
                            "
                        ></i>

                    </button>


                    <ul
                        class="
                            dropdown-menu
                            dropdown-menu-end
                        "
                    >

                        <li>

                            <button
                                class="dropdown-item"
                                type="button"
                                onclick="editMemo(${memo.id})"
                            >

                                <i
                                    class="
                                        bi
                                        bi-pencil
                                        me-2
                                    "
                                ></i>

                                Edit

                            </button>

                        </li>


                        <li>

                            <button
                                class="dropdown-item"
                                type="button"
                                onclick="togglePin(${memo.id})"
                            >

                                <i
                                    class="
                                        bi
                                        bi-pin-angle
                                        me-2
                                    "
                                ></i>

                                ${
                                    memo.is_pinned
                                        ? "Unpin"
                                        : "Pin"
                                }

                            </button>

                        </li>


                        <li>

                            <button
                                class="dropdown-item"
                                type="button"
                                onclick="viewMemo(${memo.id})"
                            >

                                <i
                                    class="bi bi-eye me-2"
                                ></i>

                                View

                            </button>

                        </li>


                        <li>

                            <hr
                                class="dropdown-divider"
                            >

                        </li>


                        <li>

                            <button
                                class="
                                    dropdown-item
                                    text-danger
                                "
                                type="button"
                                onclick="openDeleteModal(${memo.id})"
                            >

                                <i
                                    class="
                                        bi
                                        bi-trash
                                        me-2
                                    "
                                ></i>

                                Delete

                            </button>

                        </li>

                    </ul>

                </div>

            </div>

        </div>
    `;


    // Put card inside Bootstrap column
    column.appendChild(card);


    return column;
}

// ==========================================
// Get Public Image URL
// ==========================================

function getPublicImageUrl(storagePath) {
    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

    return data.publicUrl;
}


// ==========================================
// Image Validation
// ==========================================

function validateImages(files) {

    for (const file of files) {

        if (
            !ALLOWED_IMAGE_TYPES
                .includes(file.type)
        ) {

            return `
                Invalid image type:
                ${file.name}
            `;
        }


        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {

            return `
                ${file.name}
                is larger than 5 MB.
            `;
        }
    }


    return null;
}


// ==========================================
// Image Preview
// ==========================================

function renderImagePreview() {

    imagePreview.innerHTML = "";


    // Existing images
    existingImages.forEach(
        (image) => {

            const col =
                document.createElement("div");

            col.className =
                "col-4 col-md-3";


            const imageUrl =
                getPublicImageUrl(
                    image.storage_path
                );


            col.innerHTML = `
                <div
                    class="
                        position-relative
                    "
                >

                    <img
                        src="${imageUrl}"
                        class="
                            img-fluid
                            rounded
                            border
                        "
                        style="
                            width: 100%;
                            height: 100px;
                            object-fit: cover;
                        "
                        alt="${escapeHtml(
                            image.file_name
                        )}"
                    >

                    <button
                        type="button"
                        class="
                            btn
                            btn-sm
                            btn-danger
                            position-absolute
                            top-0
                            end-0
                            m-1
                        "
                        onclick="
                            removeExistingImage(
                                ${image.id}
                            )
                        "
                        aria-label="Remove image"
                    >
                        <i
                            class="bi bi-x"
                        ></i>
                    </button>

                </div>
            `;


            imagePreview.appendChild(col);
        }
    );


    // New selected images
    selectedImages.forEach(
        (file, index) => {

            const reader =
                new FileReader();


            reader.onload =
                (event) => {

                    const col =
                        document.createElement(
                            "div"
                        );

                    col.className =
                        "col-4 col-md-3";


                    col.innerHTML = `
                        <div
                            class="
                                position-relative
                            "
                        >

                            <img
                                src="${event.target.result}"
                                class="
                                    img-fluid
                                    rounded
                                    border
                                "
                                style="
                                    width: 100%;
                                    height: 100px;
                                    object-fit: cover;
                                "
                                alt="Selected image"
                            >

                            <button
                                type="button"
                                class="
                                    btn
                                    btn-sm
                                    btn-danger
                                    position-absolute
                                    top-0
                                    end-0
                                    m-1
                                "
                                onclick="
                                    removeSelectedImage(
                                        ${index}
                                    )
                                "
                                aria-label="Remove selected image"
                            >
                                <i
                                    class="bi bi-x"
                                ></i>
                            </button>

                        </div>
                    `;


                    imagePreview.appendChild(
                        col
                    );
                };


            reader.readAsDataURL(file);
        }
    );
}


// ==========================================
// Image Input
// ==========================================

if (memoImages) {

    memoImages.addEventListener(
        "change",
        () => {

            const files =
                Array.from(
                    memoImages.files
                );


            const error =
                validateImages(files);


            if (error) {

                showError(error);

                memoImages.value = "";

                return;
            }


            selectedImages = files;

            renderImagePreview();
        }
    );
}


// ==========================================
// Remove Selected Image
// ==========================================

function removeSelectedImage(index) {

    selectedImages.splice(
        index,
        1
    );

    renderImagePreview();
}


// ==========================================
// Remove Existing Image
// ==========================================

async function removeExistingImage(id) {

    const image =
        existingImages.find(
            (item) => item.id === id
        );


    if (!image) {
        return;
    }


    const confirmed =
        confirm(
            "Delete this image?"
        );


    if (!confirmed) {
        return;
    }


    try {

        // Delete Storage file
        const {
            error: storageError
        } =
            await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([
                    image.storage_path
                ]);


        if (storageError) {
            throw storageError;
        }


        // Delete database record
        const {
            error: databaseError
        } =
            await supabase
                .from("memo_images")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (databaseError) {
            throw databaseError;
        }


        existingImages =
            existingImages.filter(
                (item) =>
                    item.id !== id
            );


        renderImagePreview();


        showToast(
            "Image deleted."
        );

    } catch (error) {

        console.error(error);

        showError(
            "Failed to delete image."
        );
    }
}


// ==========================================
// Upload Memo Images
// ==========================================

async function uploadMemoImages(
    memoId,
    files
) {

    if (!files.length) {
        return [];
    }


    const uploadedImages = [];


    for (const file of files) {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const fileName =
            `${crypto.randomUUID()}.${extension}`;


        const storagePath =
            `${memoId}/${fileName}`;


        // Upload actual file
        const {
            error: uploadError
        } =
            await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(
                    storagePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


        if (uploadError) {

            throw uploadError;
        }


        // Save metadata
        const {
            error: databaseError
        } =
            await supabase
                .from("memo_images")
                .insert({
                    memo_id: memoId,
                    storage_path:
                        storagePath,
                    file_name:
                        file.name
                });


        if (databaseError) {

            // Roll back Storage file
            await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([
                    storagePath
                ]);

            throw databaseError;
        }


        uploadedImages.push(
            storagePath
        );
    }


    return uploadedImages;
}


// ==========================================
// Create Memo
// ==========================================

function openCreateModal() {
    console.log("Opening create memo modal...");

    memoForm.reset();

    memoId.value = "";

    memoCategory.value =
        "Personal";

    memoPinned.checked =
        false;


    existingImages = [];

    selectedImages = [];


    if (memoImages) {
        memoImages.value = "";
    }


    imagePreview.innerHTML = "";


    memoModalLabel.textContent =
        "Create Memo";


    memoModal.show();


    setTimeout(() => {

        memoTitle.focus();

    }, 300);
}


// ==========================================
// Save Memo
// ==========================================

async function saveMemo(event) {

    event.preventDefault();


    const title =
        memoTitle.value.trim();

    const content =
        memoContent.value.trim();

    const category =
        memoCategory.value || "Other";

    const isPinned =
        memoPinned.checked;


    // ======================================
    // Validation
    // ======================================

    if (!title) {

        memoTitle.focus();

        showToast(
            "Please enter a title."
        );

        return;
    }


    // ======================================
    // Validate Images
    // ======================================

    const imageError =
        validateImages(
            selectedImages
        );


    if (imageError) {

        showError(imageError);

        return;
    }


    try {

        setFormLoading(true);


        let savedMemo;


        // ==================================
        // EDIT
        // ==================================

        if (memoId.value) {

            const id =
                Number(
                    memoId.value
                );


            const {
                data,
                error
            } =
                await supabase
                    .from("memos")
                    .update({
                        title,
                        content,
                        category,
                        is_pinned:
                            isPinned,
                        updated_at:
                            new Date()
                                .toISOString()
                    })
                    .eq(
                        "id",
                        id
                    )
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            savedMemo = data;


            // Upload newly selected images
            if (
                selectedImages.length
            ) {

                await uploadMemoImages(
                    id,
                    selectedImages
                );
            }


            showToast(
                "Memo updated successfully."
            );

        }


        // ==================================
        // CREATE
        // ==================================

        else {

            const {
                data,
                error
            } =
                await supabase
                    .from("memos")
                    .insert({
                        title,
                        content,
                        category,
                        is_pinned:
                            isPinned
                    })
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            savedMemo = data;


            // Upload images
            if (
                selectedImages.length
            ) {

                try {

                    await uploadMemoImages(
                        savedMemo.id,
                        selectedImages
                    );

                } catch (imageError) {

                    // If image upload fails,
                    // remove memo as rollback
                    await supabase
                        .from("memos")
                        .delete()
                        .eq(
                            "id",
                            savedMemo.id
                        );

                    throw imageError;
                }
            }


            showToast(
                "Memo created successfully."
            );
        }


        memoModal.hide();


        await loadMemos();


    } catch (error) {

        console.error(
            "Failed to save memo:",
            error
        );


        showError(
            error.message ||
            "Failed to save memo."
        );

    } finally {

        setFormLoading(false);
    }
}


// ==========================================
// Edit Memo
// ==========================================

async function editMemo(id) {

    const memo =
        memos.find(
            (item) =>
                item.id === id
        );


    if (!memo) {
        return;
    }


    memoId.value =
        memo.id;

    memoTitle.value =
        memo.title || "";

    memoContent.value =
        memo.content || "";

    memoCategory.value =
        memo.category || "Other";

    memoPinned.checked =
        Boolean(
            memo.is_pinned
        );


    existingImages =
        memo.memo_images
            ? [...memo.memo_images]
            : [];


    selectedImages = [];


    if (memoImages) {
        memoImages.value = "";
    }


    renderImagePreview();


    memoModalLabel.textContent =
        "Edit Memo";


    memoModal.show();


    setTimeout(() => {

        memoTitle.focus();

    }, 300);
}


// ==========================================
// Delete Modal
// ==========================================

function openDeleteModal(id) {

    const memo =
        memos.find(
            (item) =>
                item.id === id
        );


    if (!memo) {
        return;
    }


    memoToDelete = id;

    deleteModal.show();
}


// ==========================================
// Delete Memo
// ==========================================

async function deleteMemo() {

    if (
        memoToDelete === null
    ) {
        return;
    }


    try {

        confirmDeleteButton.disabled =
            true;


        const memo =
            memos.find(
                (item) =>
                    item.id ===
                    memoToDelete
            );


        if (!memo) {
            return;
        }


        // ==================================
        // Delete Storage Images
        // ==================================

        const images =
            memo.memo_images || [];


        if (images.length) {

            const paths =
                images.map(
                    (image) =>
                        image.storage_path
                );


            const {
                error:
                    storageError
            } =
                await supabase.storage
                    .from(
                        STORAGE_BUCKET
                    )
                    .remove(paths);


            if (storageError) {

                throw storageError;
            }
        }


        // ==================================
        // Delete Memo
        // ==================================

        const {
            error
        } =
            await supabase
                .from("memos")
                .delete()
                .eq(
                    "id",
                    memoToDelete
                );


        if (error) {
            throw error;
        }


        deleteModal.hide();


        memoToDelete = null;


        showToast(
            "Memo deleted successfully."
        );


        await loadMemos();


    } catch (error) {

        console.error(
            "Failed to delete memo:",
            error
        );


        showError(
            "Failed to delete memo."
        );

    } finally {

        confirmDeleteButton.disabled =
            false;
    }
}


// ==========================================
// Pin / Unpin
// ==========================================

async function togglePin(id) {

    const memo =
        memos.find(
            (item) =>
                item.id === id
        );


    if (!memo) {
        return;
    }


    try {

        const newPinned =
            !memo.is_pinned;


        const {
            error
        } =
            await supabase
                .from("memos")
                .update({
                    is_pinned:
                        newPinned,
                    updated_at:
                        new Date()
                            .toISOString()
                })
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        showToast(
            newPinned
                ? "Memo pinned."
                : "Memo unpinned."
        );


        await loadMemos();


    } catch (error) {

        console.error(error);

        showError(
            "Failed to update pin."
        );
    }
}


// ==========================================
// Sorting
// ==========================================

function sortMemos(
    list,
    sortType
) {

    const sorted =
        [...list];


    switch (sortType) {

        case "created":

            sorted.sort(
                (a, b) =>
                    new Date(
                        b.created_at
                    ) -
                    new Date(
                        a.created_at
                    )
            );

            break;


        case "oldest":

            sorted.sort(
                (a, b) =>
                    new Date(
                        a.created_at
                    ) -
                    new Date(
                        b.created_at
                    )
            );

            break;


        case "az":

            sorted.sort(
                (a, b) =>
                    (a.title || "")
                        .localeCompare(
                            b.title || ""
                        )
            );

            break;


        case "pinned":

            sorted.sort(
                (a, b) => {

                    if (
                        a.is_pinned !==
                        b.is_pinned
                    ) {

                        return (
                            Number(
                                b.is_pinned
                            ) -
                            Number(
                                a.is_pinned
                            )
                        );
                    }


                    return (
                        new Date(
                            b.updated_at
                        ) -
                        new Date(
                            a.updated_at
                        )
                    );
                }
            );

            break;


        case "updated":

        default:

            sorted.sort(
                (a, b) =>
                    new Date(
                        b.updated_at
                    ) -
                    new Date(
                        a.updated_at
                    )
            );

            break;
    }


    return sorted;
}


// ==========================================
// Search / Filter
// ==========================================

searchInput.addEventListener(
    "input",
    renderMemos
);

categoryFilter.addEventListener(
    "change",
    renderMemos
);

sortSelect.addEventListener(
    "change",
    renderMemos
);


// ==========================================
// Form
// ==========================================

memoForm.addEventListener(
    "submit",
    saveMemo
);


// ==========================================
// Buttons
// ==========================================

document
    .getElementById(
        "newMemoButton"
    )
    .addEventListener(
        "click",
        openCreateModal
    );


document
    .getElementById(
        "emptyCreateButton"
    )
    .addEventListener(
        "click",
        openCreateModal
    );


confirmDeleteButton.addEventListener(
    "click",
    deleteMemo
);


// ==========================================
// Form Loading
// ==========================================

function setFormLoading(
    loading
) {

    const submitButton =
        memoForm.querySelector(
            'button[type="submit"]'
        );


    if (!submitButton) {
        return;
    }


    submitButton.disabled =
        loading;


    if (loading) {

        submitButton.dataset.originalText =
            submitButton.innerHTML;


        submitButton.innerHTML = `
            <span
                class="
                    spinner-border
                    spinner-border-sm
                    me-2
                "
                aria-hidden="true"
            ></span>

            Saving...
        `;

    } else {

        submitButton.innerHTML =
            submitButton.dataset
                .originalText ||
            "Save";
    }
}


// ==========================================
// Toast
// ==========================================

function showToast(message) {

    const toastElement =
        document.getElementById(
            "toast"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    toastMessage.textContent =
        message;


    const toast =
        bootstrap.Toast
            .getOrCreateInstance(
                toastElement,
                {
                    delay: 2500
                }
            );


    toast.show();
}


// ==========================================
// Dark Mode
// ==========================================

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    if (savedTheme) {

        document.documentElement
            .setAttribute(
                "data-bs-theme",
                savedTheme
            );

        updateThemeButton(
            savedTheme
        );

        return;
    }


    const prefersDark =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;


    const theme =
        prefersDark
            ? "dark"
            : "light";


    document.documentElement
        .setAttribute(
            "data-bs-theme",
            theme
        );


    updateThemeButton(
        theme
    );
}


function toggleTheme() {

    const currentTheme =
        document.documentElement
            .getAttribute(
                "data-bs-theme"
            );


    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    document.documentElement
        .setAttribute(
            "data-bs-theme",
            newTheme
        );


    localStorage.setItem(
        "theme",
        newTheme
    );


    updateThemeButton(
        newTheme
    );
}


function updateThemeButton(
    theme
) {

    themeButton.innerHTML =
        theme === "dark"
            ? `
                <i
                    class="bi bi-sun"
                    aria-hidden="true"
                ></i>
              `
            : `
                <i
                    class="bi bi-moon"
                    aria-hidden="true"
                ></i>
              `;
}


themeButton.addEventListener(
    "click",
    toggleTheme
);

// ==========================================
// View Memo
// ==========================================

function viewMemo(id) {

    const memo =
        memos.find(
            (item) => item.id === id
        );

    if (!memo) {
        return;
    }


    // ======================================
    // Basic information
    // ======================================

    viewMemoTitle.textContent =
        memo.title || "Untitled Memo";

    viewMemoContent.textContent =
        memo.content || "";

    viewMemoCategory.textContent =
        memo.category || "Other";

    viewMemoDate.textContent =
        formatDate(memo.updated_at);


    // ======================================
    // Pinned
    // ======================================

    if (memo.is_pinned) {

        viewMemoPinned.classList.remove(
            "d-none"
        );

    } else {

        viewMemoPinned.classList.add(
            "d-none"
        );
    }


    // ======================================
    // Images
    // ======================================

    renderViewMemoImages(
        memo.memo_images || []
    );


    // ======================================
    // Edit button
    // ======================================

    viewMemoEditButton.onclick =
        () => {

            viewMemoModal.hide();

            setTimeout(() => {
                editMemo(id);
            }, 300);

        };


    // ======================================
    // Show modal
    // ======================================

    viewMemoModal.show();
}
// ==========================================
// Render View Memo Images
// ==========================================

function renderViewMemoImages(images) {

    viewMemoImages.innerHTML = "";

    viewMemoImages.className =
        "facebook-gallery";


    if (!images || images.length === 0) {

        viewMemoImages.classList.add(
            "no-images"
        );

        return;
    }


    // ======================================
    // Gallery layout
    // ======================================

    if (images.length === 1) {

        viewMemoImages.classList.add(
            "gallery-1"
        );

    } else if (images.length === 2) {

        viewMemoImages.classList.add(
            "gallery-2"
        );

    } else if (images.length === 3) {

        viewMemoImages.classList.add(
            "gallery-3"
        );

    } else if (images.length === 4) {

        viewMemoImages.classList.add(
            "gallery-4"
        );

    } else {

        viewMemoImages.classList.add(
            "gallery-many"
        );
    }


    // ======================================
    // Render every image
    // ======================================

    images.forEach(
        (image) => {

            const imageUrl =
                getPublicImageUrl(
                    image.storage_path
                );


            const img =
                document.createElement("img");


            img.src = imageUrl;

            img.alt =
                image.file_name || "Memo image";


            img.loading = "lazy";


            img.addEventListener(
                "click",
                () => {
                    openImageViewer(imageUrl);
                }
            );


            viewMemoImages.appendChild(img);
        }
    );
}
// ==========================================
// Image Viewer
// ==========================================

function openImageViewer(imageUrl) {

    viewerImage.src = imageUrl;

    imageViewerModal.show();
}

// ==========================================
// Make functions available to HTML
// ==========================================

window.editMemo =
    editMemo;

window.togglePin =
    togglePin;

window.viewMemo =
    viewMemo;

window.openDeleteModal =
    openDeleteModal;

window.removeExistingImage =
    removeExistingImage;

window.removeSelectedImage =
    removeSelectedImage;


// ==========================================
// Initialize
// ==========================================

loadTheme();

loadMemos();