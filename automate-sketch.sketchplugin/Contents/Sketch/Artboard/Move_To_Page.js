var onRun = function(context) {

    var ga = require("../modules/Google_Analytics");
    ga("Symbol");

    var document = context.document;
    var selection = context.selection;

    var originalPage = document.currentPage();

    if (selection.count() == 0) {
        document.showMessage("Please select at least 1 symbol master.");
        return;
    }

    var symbolMasters = symbolMasterInSelection(selection);
    if (symbolMasters.count() == 0) {
        document.showMessage("There are no symbol masters in your selection.");
        return;
    }

    // Dialog
    var dialog = COSAlertWindow.alloc().init();
    dialog.setMessageText("Move Symbol Masters To Another Page");
    dialog.setInformativeText("Move selected symbol masters to another page.");
    dialog.addButtonWithTitle("OK");
    dialog.addButtonWithTitle("Cancel");

    dialog.addTextLabelWithValue("Choose Page:");

    var pageList = document.pages().mutableCopy();
    pageList.removeObject(originalPage);

    var pageListView = NSPopUpButton.alloc().initWithFrame(NSMakeRect(0, 0, 200, 30));
    pageListView.addItemWithTitle("New Blank Page");
    var loopPageList = pageList.objectEnumerator();
    var page;
    while (page = loopPageList.nextObject()) {
        pageListView.addItemWithTitle("");
        pageListView.lastItem().setTitle(page.name());
    }
    dialog.addAccessoryView(pageListView);

    var responseCode = dialog.runModal();
    if (responseCode == 1000) {

        if (pageListView.indexOfSelectedItem() == 0) {
            var targetPage = document.addBlankPage();
            document.setCurrentPage(originalPage);
        } else {
            var targetPage = pageList.objectAtIndex(pageListView.indexOfSelectedItem() - 1);
        }

        var loopSymbolMasters = symbolMasters.objectEnumerator();
        var symbolMaster;
        while (symbolMaster = loopSymbolMasters.nextObject()) {

            var artboardPosition;
            if (MSApplicationMetadata.metadata().appVersion >= 49) {
                artboardPosition = targetPage.originForNewArtboardWithSize(symbolMaster.rect().size);
            } else {
                artboardPosition = targetPage.originForNewArtboard();
            }

            var positionX = artboardPosition.x;
            var positionY = artboardPosition.y;

            targetPage.addLayer(symbolMaster);
            originalPage.removeLayer(symbolMaster);

            symbolMaster.frame().setX(positionX);
            symbolMaster.frame().setY(positionY);

        }

        document.setCurrentPage(targetPage);

        // Center layers
        var rects = symbolMasters.slice().map(function(item) {
            return MSRect.alloc().initWithRect(item.absoluteRect().rect());
        });
        var rect = MSRect.rectWithUnionOfRects(rects).rect();
        document.contentDrawView().centerRect_animated(rect, true);

    }

};

function symbolMasterInSelection(selection) {
    var predicate = NSPredicate.predicateWithFormat("className == %@", "MSSymbolMaster");
    var symbolMasters = selection.filteredArrayUsingPredicate(predicate);
    return symbolMasters;
}