
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play } from 'lucide-react';

interface ExerciseModelViewerProps {
  exerciseId: string;
  onTrain: () => void;
}

// Mock data for visualization
const MOCK_KEYPOINTS = [
  {time: 0, keypoints: {
    shoulders: {x: 50, y: 20},
    elbows: {x: 65, y: 30},
    knees: {x: 50, y: 70},
    ankles: {x: 50, y: 90}
  }},
  {time: 0.5, keypoints: {
    shoulders: {x: 50, y: 22},
    elbows: {x: 65, y: 32},
    knees: {x: 50, y: 75},
    ankles: {x: 50, y: 90}
  }},
  {time: 1, keypoints: {
    shoulders: {x: 50, y: 25},
    elbows: {x: 65, y: 35},
    knees: {x: 50, y: 80},
    ankles: {x: 50, y: 90}
  }},
  {time: 1.5, keypoints: {
    shoulders: {x: 50, y: 30},
    elbows: {x: 65, y: 40},
    knees: {x: 50, y: 85},
    ankles: {x: 50, y: 90}
  }},
  {time: 2, keypoints: {
    shoulders: {x: 50, y: 35},
    elbows: {x: 65, y: 45},
    knees: {x: 50, y: 70},
    ankles: {x: 50, y: 90}
  }},
  {time: 2.5, keypoints: {
    shoulders: {x: 50, y: 25},
    elbows: {x: 65, y: 35},
    knees: {x: 50, y: 60},
    ankles: {x: 50, y: 90}
  }},
  {time: 3, keypoints: {
    shoulders: {x: 50, y: 20},
    elbows: {x: 65, y: 30},
    knees: {x: 50, y: 70},
    ankles: {x: 50, y: 90}
  }},
];

const ExerciseModelViewer: React.FC<ExerciseModelViewerProps> = ({ 
  exerciseId,
  onTrain 
}) => {
  const [animating, setAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  
  const handlePlayAnimation = () => {
    setAnimating(true);
    setCurrentFrame(0);
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= MOCK_KEYPOINTS.length - 1) {
          clearInterval(interval);
          setAnimating(false);
          return 0;
        }
        return prev + 1;
      });
    }, 200); // ~5fps for visualization
  };

  // Function to draw the stick figure on canvas
  const drawStickFigure = (ctx: CanvasRenderingContext2D, keypoints: any, color: string) => {
    const { shoulders, elbows, knees, ankles } = keypoints;
    
    // Draw head (circle above shoulders)
    ctx.beginPath();
    ctx.arc(shoulders.x, shoulders.y - 10, 10, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw torso (shoulders to hips)
    const hips = { x: shoulders.x, y: shoulders.y + 30 };
    ctx.beginPath();
    ctx.moveTo(shoulders.x, shoulders.y);
    ctx.lineTo(hips.x, hips.y);
    ctx.stroke();
    
    // Draw arms
    ctx.beginPath();
    ctx.moveTo(shoulders.x - 15, shoulders.y + 5);
    ctx.lineTo(elbows.x - 15, elbows.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(shoulders.x + 15, shoulders.y + 5);
    ctx.lineTo(elbows.x + 15, elbows.y);
    ctx.stroke();
    
    // Draw legs
    ctx.beginPath();
    ctx.moveTo(hips.x - 10, hips.y);
    ctx.lineTo(knees.x - 10, knees.y);
    ctx.lineTo(ankles.x - 10, ankles.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(hips.x + 10, hips.y);
    ctx.lineTo(knees.x + 10, knees.y);
    ctx.lineTo(ankles.x + 10, ankles.y);
    ctx.stroke();
    
    // Draw joints as circles
    const joints = [
      shoulders,
      { x: shoulders.x - 15, y: shoulders.y + 5 },
      { x: shoulders.x + 15, y: shoulders.y + 5 },
      elbows,
      { x: elbows.x - 15, y: elbows.y },
      { x: elbows.x + 15, y: elbows.y },
      hips,
      knees,
      { x: knees.x - 10, y: knees.y },
      { x: knees.x + 10, y: knees.y },
      ankles,
      { x: ankles.x - 10, y: ankles.y },
      { x: ankles.x + 10, y: ankles.y }
    ];
    
    joints.forEach(joint => {
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualizar Modelo</CardTitle>
        <CardDescription>
          Visualize e compare os modelos de referência
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="reference">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="reference">Modelo de Referência</TabsTrigger>
            <TabsTrigger value="comparison">Comparação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reference" className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <canvas 
                width="300" 
                height="300" 
                className="w-full h-64 bg-white rounded border"
                ref={canvas => {
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      const frame = MOCK_KEYPOINTS[currentFrame];
                      if (frame) {
                        drawStickFigure(ctx, frame.keypoints, '#4361EE');
                      }
                    }
                  }
                }}
              />
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                  Frame {currentFrame + 1} de {MOCK_KEYPOINTS.length}
                </span>
                <Button 
                  onClick={handlePlayAnimation} 
                  disabled={animating}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {animating ? "Reproduzindo..." : "Reproduzir Animação"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Métricas do Modelo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-medium text-sm text-gray-500">Amplitude do Movimento</div>
                  <div className="text-2xl font-bold">85°</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-medium text-sm text-gray-500">Tempo de Execução</div>
                  <div className="text-2xl font-bold">3.2s</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-medium text-sm text-gray-500">Velocidade de Descida</div>
                  <div className="text-2xl font-bold">1.8s</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-medium text-sm text-gray-500">Velocidade de Subida</div>
                  <div className="text-2xl font-bold">1.4s</div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={onTrain}>
                  Incorporar ao Modelo Ideal
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="comparison">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-center font-medium mb-2">Modelo Atual</h4>
                  <canvas 
                    width="300" 
                    height="300" 
                    className="w-full h-48 bg-white rounded border"
                    ref={canvas => {
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          const frame = MOCK_KEYPOINTS[currentFrame];
                          if (frame) {
                            drawStickFigure(ctx, frame.keypoints, '#4361EE');
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                <div>
                  <h4 className="text-center font-medium mb-2">Upload Recente</h4>
                  <canvas 
                    width="300" 
                    height="300" 
                    className="w-full h-48 bg-white rounded border"
                    ref={canvas => {
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          // Slight variation for comparison
                          const frame = MOCK_KEYPOINTS[currentFrame];
                          if (frame) {
                            const modified = JSON.parse(JSON.stringify(frame.keypoints));
                            modified.knees.y += 5;
                            modified.elbows.x -= 5;
                            drawStickFigure(ctx, modified, '#EA384C');
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                  Frame {currentFrame + 1} de {MOCK_KEYPOINTS.length}
                </span>
                <Button 
                  onClick={handlePlayAnimation} 
                  disabled={animating}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {animating ? "Reproduzindo..." : "Reproduzir Animação"}
                </Button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border mt-4">
              <h3 className="text-lg font-medium mb-2">Análise de Diferenças</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Alinhamento do joelho</span>
                    <span className="text-amber-600 font-medium">85% similar</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mt-1">
                    <div className="h-2 bg-amber-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Ângulo do cotovelo</span>
                    <span className="text-red-600 font-medium">72% similar</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mt-1">
                    <div className="h-2 bg-red-500 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Postura das costas</span>
                    <span className="text-green-600 font-medium">94% similar</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mt-1">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExerciseModelViewer;
