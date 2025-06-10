
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft, Save, Clock, HelpCircle, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { QuestionImageUpload } from '@/components/QuestionImageUpload';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  question: string;
  answers: Answer[];
  timeLimit: number;
  imageUrl?: string;
}

interface Quiz {
  title: string;
  description: string;
  questions: Question[];
}

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    question: '',
    answers: [
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false },
      { id: '3', text: '', isCorrect: false },
      { id: '4', text: '', isCorrect: false }
    ],
    timeLimit: 30
  });

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast({ title: "Please enter a question", variant: "destructive" });
      return;
    }

    const hasCorrectAnswer = currentQuestion.answers.some(answer => answer.isCorrect && answer.text.trim());
    const hasMultipleAnswers = currentQuestion.answers.filter(answer => answer.text.trim()).length >= 2;

    if (!hasCorrectAnswer) {
      toast({ title: "Please select a correct answer", variant: "destructive" });
      return;
    }

    if (!hasMultipleAnswers) {
      toast({ title: "Please provide at least 2 answer options", variant: "destructive" });
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now().toString(),
      answers: currentQuestion.answers.filter(answer => answer.text.trim())
    };

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    setCurrentQuestion({
      id: '',
      question: '',
      answers: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false }
      ],
      timeLimit: 30
    });

    toast({ title: "Question added successfully!" });
  };

  const removeQuestion = (questionId: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const updateAnswer = (answerId: string, text: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      answers: prev.answers.map(answer =>
        answer.id === answerId ? { ...answer, text } : answer
      )
    }));
  };

  const toggleCorrectAnswer = (answerId: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      answers: prev.answers.map(answer => ({
        ...answer,
        isCorrect: answer.id === answerId ? !answer.isCorrect : false
      }))
    }));
  };

  const handleImageAdd = (imageUrl: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      imageUrl
    }));
  };

  const handleImageRemove = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      imageUrl: undefined
    }));
  };

  const saveQuiz = () => {
    if (!quiz.title.trim()) {
      toast({ title: "Please enter a quiz title", variant: "destructive" });
      return;
    }

    if (quiz.questions.length === 0) {
      toast({ title: "Please add at least one question", variant: "destructive" });
      return;
    }

    const quizId = Date.now().toString();
    const savedQuiz = { ...quiz, id: quizId };
    localStorage.setItem(`quiz_${quizId}`, JSON.stringify(savedQuiz));

    toast({ title: "Quiz saved successfully!" });
    navigate(`/host/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Create Your Quiz
          </h1>
          <Button 
            onClick={saveQuiz}
            className="bg-white text-black hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Quiz
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quiz Info - 3D Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-2xl border-0 transform hover:scale-105 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-gray-900 to-black text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Quiz Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-black font-semibold">Quiz Title</Label>
                  <Input
                    id="title"
                    value={quiz.title}
                    onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter quiz title"
                    className="border-2 border-gray-200 focus:border-black transition-colors shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-black font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={quiz.description}
                    onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your quiz"
                    className="border-2 border-gray-200 focus:border-black transition-colors shadow-sm resize-none"
                    rows={3}
                  />
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-bold text-black mb-4 flex items-center gap-2">
                    Questions ({quiz.questions.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-3">
                    {quiz.questions.map((question, index) => (
                      <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-black shadow-sm">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-black truncate block">
                            {index + 1}. {question.question}
                          </span>
                          {question.imageUrl && (
                            <div className="flex items-center gap-1 mt-1">
                              <Image className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">Has image</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {quiz.questions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No questions added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Builder - 3D Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-2xl border-0 transform hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-gray-900 to-black text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Question
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-black font-semibold">Question</Label>
                  <Textarea
                    id="question"
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter your question here..."
                    className="text-lg border-2 border-gray-200 focus:border-black transition-colors shadow-sm resize-none"
                    rows={2}
                  />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-2">
                  <Label className="text-black font-semibold flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Question Image (Optional)
                  </Label>
                  <QuestionImageUpload
                    onImageAdd={handleImageAdd}
                    currentImage={currentQuestion.imageUrl}
                    onImageRemove={handleImageRemove}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {currentQuestion.answers.map((answer, index) => (
                    <div key={answer.id} className="space-y-2">
                      <Label className="text-black font-semibold">
                        Answer {String.fromCharCode(65 + index)}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={answer.text}
                          onChange={(e) => updateAnswer(answer.id, e.target.value)}
                          placeholder={`Answer option ${String.fromCharCode(65 + index)}`}
                          className="flex-1 border-2 border-gray-200 focus:border-black transition-colors shadow-sm"
                        />
                        <Button
                          type="button"
                          variant={answer.isCorrect ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCorrectAnswer(answer.id)}
                          className={answer.isCorrect 
                            ? "bg-black hover:bg-gray-800 text-white shadow-lg transform hover:scale-105 transition-all" 
                            : "border-2 border-black text-black hover:bg-black hover:text-white shadow-lg transform hover:scale-105 transition-all"
                          }
                        >
                          {answer.isCorrect ? "✓" : "○"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="timeLimit" className="text-black font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Limit
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="timeLimit"
                        type="number"
                        value={currentQuestion.timeLimit}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                        className="w-20 border-2 border-gray-200 focus:border-black transition-colors shadow-sm"
                        min="5"
                        max="120"
                      />
                      <span className="text-black font-medium">seconds</span>
                    </div>
                  </div>
                  <Button 
                    onClick={addQuestion} 
                    className="bg-black hover:bg-gray-800 text-white shadow-lg transform hover:scale-105 transition-all px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
