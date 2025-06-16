---
editUrl: false
next: false
prev: false
title: "MessageItem"
---

```ts
type MessageItem = 
  | {
  content: string;
  id: string;
  providerData: Record<string, any>;
  role: "system";
  type: "message";
 }
  | {
  content: (
     | {
     providerData: Record<string, any>;
     refusal: string;
     type: "refusal";
    }
     | {
     providerData: Record<string, any>;
     text: string;
     type: "output_text";
    }
     | {
     providerData: Record<string, any>;
     text: string;
     type: "input_text";
    }
     | {
     audio:   | string
        | {
        id: string;
       };
     format: null | string;
     providerData: Record<string, any>;
     transcript: null | string;
     type: "audio";
    }
     | {
     image: string;
     providerData: Record<string, any>;
     type: "image";
    })[];
  id: string;
  providerData: Record<string, any>;
  role: "assistant";
  status: "in_progress" | "completed" | "incomplete";
  type: "message";
 }
  | {
  content:   | string
     | (
     | {
     providerData: Record<string, any>;
     text: string;
     type: "input_text";
    }
     | {
     image:   | string
        | {
        id: string;
       };
     providerData: Record<string, any>;
     type: "input_image";
    }
     | {
     file:   | string
        | {
        id: string;
       };
     providerData: Record<string, any>;
     type: "input_file";
    }
     | {
     audio:   | string
        | {
        id: string;
       };
     format: null | string;
     providerData: Record<string, any>;
     transcript: null | string;
     type: "audio";
    })[];
  id: string;
  providerData: Record<string, any>;
  role: "user";
  type: "message";
};
```
