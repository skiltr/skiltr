<?php
require_once __DIR__ . '/inc/auth.php';
$userKeys = require_user_identity();

// 1) URL Language
if (isset($_GET['lang'])) {
    $lang = strtolower($_GET['lang']);
} else {
    // 2) Browser language detection
    $accept = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';
    $lang = str_starts_with(strtolower($accept), 'de') ? 'de' : 'en';
}
?>

<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Asul&display=swap" rel="stylesheet">
    <script src="https://kit.fontawesome.com/1238045edb.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="css/style.css?<?= time() ?>">
    <link rel="stylesheet" href="css/skillbar.css?<?= time() ?>">
    <title>Guild Wars Skilter</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>

<body>

<div class="app">

    <!-- LEFT -->
    <aside class="panel filters mobile-page scrollable">
        <div class="logo">
            <img src="https://skilter.magical.ch/img/skiltr4.png" alt="Skilter">

        </div>
        <div id="filterCapsules">
            <!-- filter pills go here -->
        </div>
    </aside>

    <!-- CENTER -->
<section class="center mobile-page">

<!-- SKILL TOOLBAR PANEL -->
<div class="panel skill-toolbar-panel">

    <!-- MAIN TOOLBAR (always visible) -->
    <div class="skill-list-toolbar" id="skillListToolbar">
        <div class="view-modes">
            <button data-mode="list-compact"><i class="fa-duotone fa-regular fa-list" title="Compact View"></i></button>
            <button data-mode="list-detailed"><i class="fa-solid fa-browser" title="Detailed View"></i></button>
            <button data-mode="icon-grid"><i class="fa-sharp fa-solid fa-grid" title="Icon Grid View"></i></button>
        </div>

<div class="skill-search" id="skillSearch">
    <input id="skillSearchInput"
	   class="form-control"
           type="text"
           autocomplete="off"
           spellcheck="false"
           placeholder="Loading skills…">
</div>


        <div class="skill-toolbar-main" id="skillListHeader"></div>
        <button class="skill-toolbar-more"
                id="skillToolbarMore"
                title="Sort - Group - Filter">
            <i class="fa-sharp fa-solid fa-sort"></i>
            <i class="fa-sharp fa-solid fa-layer-group"></i>
        </button>

    </div>

    <!-- EXTENSION PANEL (hidden by default) -->
    <div class="skill-toolbar-extension" id="skillToolbarExtension">
        <!-- sorting / grouping controls go here -->
    </div>

</div>




    <!-- SKILL LIST PANEL -->
    <div class="panel skill-list-panel">

        <div class="skill-list scrollable">
            <div class="skill-list-rows"></div>
        </div>

    </div>


    <!-- SKILL DETAILS PANEL -->
    <div class="panel skill-details" id="skillDetails">

<div class="skill-details-header">
    <h2 id="skillDetailsTitle">Skill Details</h2>

    <div class="detailsheader-icons">

        <i class="fa-solid fa-down-from-line"
           onclick="closeSkillDetails()" title="Hide Details"></i>
    </div>
</div>


        <div class="skill-details-content"
             id="skillDetailsContent">
            <p>Select a skill to view details.</p>
        </div>

    </div>


<!-- ACTIVE SKILLBAR PANEL -->
<div class="panel skillbar-panel">
<div class="skillbar-header">
    <div class="skillbar-left">
        <i id="btnUndo" class="fa-solid fa-rotate-left"></i>
        <i id="btnRedo" class="fa-solid fa-rotate-right"></i>
    </div>

    <div id="btnViewBuild">
        <i class="fa-sharp fa-regular fa-triangle"></i>
        <i class="fa-sharp fa-regular fa-triangle"></i>
        <i class="fa-sharp fa-regular fa-triangle"></i>
    </div>

    <div class="skillbar-right">
        <i class="fa-solid fa-down-from-line" onclick="toggleSkillbarPanel()"></i>
    </div>
</div>





    <div class="skillbar-host" id="skillbarHost"></div>
</div>



</section>


    <!-- RIGHT -->
    <aside class="right mobile-page">

        <div class="panel right-menu">
            <i class="fa-duotone fa-regular fa-staff" onclick="showRightPanel('builds', this)"></i>
            <i class="fa-duotone fa-solid fa-books fa-swap-opacity" onclick="showRightPanel('bookmarks', this)"></i>
            <i class="fa-etch fa-solid fa-star active" onclick="showRightPanel('settings', this)"></i>
            <i class="fa-duotone fa-regular fa-hat-wizard" onclick="showRightPanel('account', this)"></i>
<!--            <i class="fa-solid fa-user-group" onclick="showRightPanel('friends', this)"></i> -->

        </div>

        <div class="panel right-content scrollable">

            <div class="right-panel" id="panel-builds">
<i class="fa-utility-duo fa-semibold fa-keyboard fa-rotate-180 fa-swap-opacity" title="A Build"></i>
<i class="fa-sharp fa-solid fa-square-info" title="View Build Info"></i>
<i class="fa-solid fa-clipboard" title="Copy Buildcode to Clipboard"></i>
<i class="fa-solid fa-down-to-dotted-line" title="Add Build to Current Skillbar"></i>
<i class="fa-solid fa-star" title="Build Attributes"></i>
<i class="fa-solid fa-money-check-pen" title="Edit Name / Description"></i>
<i class="fa-solid fa-clone" title="Duplicate Build"></i>
<i class="fa-solid fa-share" title="Share Build online"></i>
<i class="fa-solid fa-arrows-from-line" title="Move Build"></i>
<i class="fa-duotone fa-regular fa-triangle-exclamation" title="WARNING!"></i>
<i class="fa-solid fa-octagon-xmark" title="Delete Build"></i>

            </div>


<div class="right-panel" id="panel-bookmarks">
    <div id="booksContainer"></div>
<div class="books-toolbar">
    <button id="btnShowCreateBook">
        <i class="fa-solid fa-plus"></i> New Book
    </button>

<div id="createBookForm" class="book-creator" style="display:none;">

    <!-- TYPE -->
    <div class="book-creator-row">
        <select id="newBookType" class="form-control">
            <option value="skill_book">Skill Book</option>
            <option value="note_book">Notebook</option>
            <option value="address_book">Address Book</option>
        </select>
    </div>

    <!-- ICON GRID -->
    <div id="bookIconGrid" class="book-icon-grid"></div>

    <!-- NAME -->
<!-- NAME ROW -->
<div class="book-name-row">
    <i id="bookPreviewIcon"
       class="book-preview-icon fa-solid fa-book"></i>

    <input id="newBookName"
	   class="form-control"
           type="text"
           placeholder="Book name"
           maxlength="60">
</div>


    <!-- COLORS -->
    <div class="book-creator-row">
        <input type="color" id="newBookColorPrimary">
        <input type="color" id="newBookColorSecondary">
    </div>

    <!-- ACTIONS -->
    <div class="book-creator-row">
        <button id="btnCreateBookConfirm" class="book-save">Create</button>
        <button id="btnCreateBookCancel" class="book-cancel">Cancel</button>
    </div>

</div>


</div>



</div>


            <div class="right-panel" id="panel-account">
                <form method="post" action="set_name.php">
                    <label>
                        <strong>Name</strong><br>
                        <input
	                    class="form-control"
                            type="text"
                            name="name"
                            value="<?= htmlspecialchars($userKeys['name']) ?>"
                            maxlength="32"
                        >
                    </label>
                    <br><br>
                    <button type="submit">Save</button>
                </form>
<?php
$restoreStatus = $_GET['restore'] ?? null;
?>
<hr style="opacity:0.15; margin:16px 0;">

<div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
    <form method="post" action="restore.php" style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
        <label style="display:block;">
            <strong>Restore (Secret Key)</strong><br>
            <input
	        class="form-control"
                type="text"
                name="secret"
                placeholder="SKL-SEC-...."
                style="width:320px; max-width:100%;"
                autocomplete="off"
                spellcheck="false"
            >
        </label>
        <button type="submit">Restore</button>
    </form>
</div>

<?php if ($restoreStatus === 'ok'): ?>
    <p style="margin-top:8px; font-size:12px; opacity:0.8;">Restored identity.</p>
<?php elseif ($restoreStatus === 'invalid'): ?>
    <p style="margin-top:8px; font-size:12px; color:#b66;">Invalid secret key.</p>
<?php elseif ($restoreStatus === 'empty'): ?>
    <p style="margin-top:8px; font-size:12px; color:#b66;">Please paste your secret key.</p>
<?php endif; ?>



                    <p>
                        <i class="fa-solid fa-bullhorn"></i><strong>Public Key</strong><br>
                        <code><?= htmlspecialchars($userKeys['public']) ?></code>
                    </p>

                    <p>
                        <i class="fa-solid fa-lock-keyhole"></i><strong>Secret Key</strong><br>
                        <code><?= htmlspecialchars($userKeys['secret']) ?></code>
                    </p>

                    <p style="font-size:12px; opacity:0.7;">
                        This account is anonymous.  
                        The secret key proves ownership.
                        You can restore your identity with it.
                        Store it somewhere safe.   
                        <u>Do not share it</u>.
                    </p>
            </div>

            <div class="right-panel" id="panel-friends">
                <p class="friend-row">
	    	    <strong><i class="fa-solid fa-user-plus"></i>Add a Friend</strong>
                </p>
                <p class="friend-row">
                    <strong>Bulala<i class="fa-solid fa-pen"></i></strong><i class="fa-solid fa-user-minus"></i>
                </p>
                <p class="friend-row">
                    <strong>Razi<i class="fa-solid fa-pen"></i></strong><i class="fa-solid fa-user-minus"></i>
                <p>
            </div>

            <div class="right-panel active" id="panel-settings">

            </div>

        </div>

    </aside>

</div>

<!-- LANGUAGE BRIDGE -->
<script>
  window.APP_LANG = <?= json_encode($lang) ?>;
</script>

<!-- DATA / GLOBAL STATE -->
<script defer src="/js/data.lookups.js?lang=<?= urlencode($lang) ?>&v=<?= time() ?>"></script>
<script defer src="/js/data.skills.js?<?= time() ?>"></script>
<script defer src="/js/collector.skills.js?<?= time() ?>"></script>
<script defer src="/js/collector.relations.js?<?= time() ?>"></script>
<script defer src="/js/drag/drag.state.js?<?= time() ?>"></script>

<!-- MODULE BRIDGE -->
<script type="module">
import * as IDS from '/js/constants/ids.js';
import * as UI from '/js/constants/ui.js';

window.IDS = IDS;
window.UI = UI;
</script>

<!-- UI LOGIC -->
<script defer src="/js/ui.skills.js?<?= time() ?>"></script>

<!-- APP BOOTSTRAP -->
<script type="module" src="/js/app.js?<?= time() ?>"></script>


</body>
</html>
