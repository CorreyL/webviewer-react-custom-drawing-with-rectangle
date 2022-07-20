import React, { useRef, useEffect } from 'react';
import WebViewer from '@pdftron/webviewer';
import './App.css';

const RADIUS = 12

const App = () => {
  const viewer = useRef(null);

  // if using a class, equivalent of componentDidMount 
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        initialDoc: '/files/PDFTRON_about.pdf',
      },
      viewer.current,
    ).then((instance) => {
      const {
        Annotations,
        annotationManager: annotManager,
        documentViewer: docViewer,
        Tools,
      } = instance.Core;

      const InspectionPointSelection = function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Annotations.TextMarkupAnnotation.call(this)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.Subject = 'InspectionPointSelection'
      }

      InspectionPointSelection.prototype = {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        draw: function (ctx, pageMatrix) {
          this.setStyles(ctx, pageMatrix)

          ctx.translate(this.X, this.Y)

          ctx.beginPath()
          ctx.setLineDash([])
          ctx.moveTo(0, 0)
          ctx.lineTo(0, this.Height)
          ctx.lineTo(this.Width, this.Height)
          ctx.lineTo(this.Width, 0)
          ctx.lineTo(0, 0)
          ctx.strokeStyle = 'rgb(50, 50, 50)'
          ctx.lineWidth = 1
          ctx.stroke()
        },
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      InspectionPointSelection.prototype = Object.assign(
        Annotations.CustomAnnotation.prototype,
        InspectionPointSelection.prototype,
      )

      class InspectionPointBubble extends Annotations.CustomAnnotation {
        constructor() {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          super('InspectionPointBubble')
          this.Subject = 'InspectionPointBubble'
          this.CustomData = {
            index: 1,
          }
          this.NoResize = true
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        draw(ctx, pageMatrix) {
          this.setStyles(ctx, pageMatrix)

          ctx.translate(this.X, this.Y)

          const FONT_SIZE = 10
          const FONT_Y = 11

          ctx.beginPath()
          ctx.font = `${FONT_SIZE}px Helvetica`
          ctx.textAlign = 'center'
          ctx.fillStyle = 'black'
          ctx.fillText(
            `${this.getCustomData('index') || '?'}`,
            RADIUS + 1,
            FONT_Y + 1,
          )
        }
      }

      // this is necessary to set the elementName before instantiation
      InspectionPointBubble.prototype.elementName = "InspectionPointBubble";
      annotManager.registerAnnotationType(
        InspectionPointBubble.prototype.elementName,
        InspectionPointBubble,
      );

      InspectionPointSelection.prototype.elementName = "inspectionPoint";

      annotManager.registerAnnotationType(
        InspectionPointSelection.prototype.elementName,
        InspectionPointSelection,
      );

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const InspectionPointCreateTool = function (docViewerInstance) {
        Tools.TextAnnotationCreateTool.call(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this,
          docViewerInstance,
          InspectionPointSelection,
        )
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.mousePtOnLeftDown = {
          x: 0,
          y: 0,
        }
      }

      InspectionPointCreateTool.prototype = Object.assign(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        new Tools.RedactionCreateTool(docViewer), {
          mouseMove: function (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            Tools.GenericAnnotationCreateTool.prototype.mouseMove.call(
              this,
              e,
            )
          },
          mouseLeftDown: function (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.mousePtOnLeftDown = {
              x: e.clientX,
              y: e.clientY,
            }
            Tools.GenericAnnotationCreateTool.prototype.mouseLeftDown.call(
              this,
              e,
            )
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (this['annotation']) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              this['annotation']['IsText'] = false
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              this['annotation']['NoMove'] = false
            }
          },
          mouseLeftUp: async function (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            Tools.GenericAnnotationCreateTool.prototype.mouseLeftUp.call(
              this,
              e,
            )
          },
        },
      )

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const inspectionPointTool = new InspectionPointCreateTool(docViewer)

      instance.registerTool({
        toolName: 'AnnotationCreateInspectionPoint',
        toolObject: inspectionPointTool,
        buttonImage: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" fill="none"><defs><style>.cls-1{fill:#868e96;}</style></defs><path fill-rule="evenodd" clip-rule="evenodd" d="M24 45C35.598 45 45 35.598 45 24C45 12.402 35.598 3 24 3C12.402 3 3 12.402 3 24C3 35.598 12.402 45 24 45ZM31.592 36H16.836V32.226H22.072V18.83C22.072 18.014 22.106 17.198 22.106 17.198H22.038C22.038 17.198 21.766 17.776 20.984 18.558L19.046 20.394L16.462 17.674L22.514 11.86H26.356V32.226H31.592V36Z"></path></svg>',
        buttonName: 'inspectionPointToolButton',
        tooltip: 'Inspection Point',
      })

      const renumberInspectionPoints = () => {
        let index = 1

        annotManager.getAnnotationsList().forEach(annotation => {
          if (annotation.Subject === 'InspectionPointBubble') {
            annotation.setCustomData('index', index.toString())
            annotManager.redrawAnnotation(annotation)
            index = index + 1
          }
        })
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      inspectionPointTool.addEventListener('annotationAdded', inspectionPointSelection => {
        const inspectionPointBubble = new InspectionPointBubble()

        inspectionPointBubble.PageNumber = inspectionPointSelection.PageNumber
        inspectionPointBubble.X = inspectionPointSelection.X - 20
        inspectionPointBubble.Y = inspectionPointSelection.Y - 20
        inspectionPointBubble.Width = 30
        inspectionPointBubble.Height = 30
        inspectionPointBubble.Author = annotManager.getCurrentUser()

        inspectionPointSelection.setCustomData('linkedId', inspectionPointBubble.Id);
        inspectionPointBubble.setCustomData('linkedId', inspectionPointSelection.Id);

        annotManager.addAnnotation(inspectionPointBubble);
        annotManager.groupAnnotations(inspectionPointSelection, [inspectionPointBubble]);
        renumberInspectionPoints()
      })

      annotManager.addEventListener('annotationChanged', (annotations, action, info) => {
        const {
          isUndoRedo,
          imported
        } = info

        if (action === 'add' && imported) {
          annotations.forEach(annot => {
            if (annot.Subject === 'InspectionPointBubble') {
              annot.setModified(false);
              annotManager.redrawAnnotation(annot);
            }
          });
        }

        if (action === 'delete') {
          // action: add, modify, delete
          annotations.forEach(annotation => {
            const linkedId = annotation.getCustomData('linkedId');

            if (linkedId) {
              const linkedAnnotation = annotManager.getAnnotationById(
                linkedId,
              )

              if (linkedAnnotation) {
                annotManager.deleteAnnotation(linkedAnnotation, {
                  isUndoRedo,
                });
              }
            }
          })
        }
        renumberInspectionPoints();
      });

      instance.UI.setToolMode('AnnotationCreateInspectionPoint');

      instance.UI.setHeaderItems(header => {
        header.push({
          type: 'actionButton',
          img: 'icon-tool-shape-rectangle',
          onClick: () => {
            instance.UI.setToolMode('AnnotationCreateInspectionPoint');
          }
        });
      });
    });
  }, []);

  return (
    <div className="App">
      <div className="header">React sample</div>
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
