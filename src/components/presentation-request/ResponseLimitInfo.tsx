'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Infinity as InfinityIcon } from 'lucide-react';
import type { PresentationRequest } from '@/types/presentation-request';

interface ResponseLimitInfoProps {
  request: PresentationRequest;
}

export function ResponseLimitInfo({ request }: ResponseLimitInfoProps) {
  const { response_count, max_responses } = request;
  const isUnlimited = max_responses === 0 || max_responses === undefined;
  const progressValue = isUnlimited ? 0 : Math.min((response_count / max_responses) * 100, 100);
  const hasReachedLimit = !isUnlimited && response_count >= max_responses;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Response Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Responses:</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{response_count}</span>
            <span className="text-muted-foreground">
              {isUnlimited ? (
                <div className="flex items-center gap-1">
                  <span>/</span>
                  <InfinityIcon className="h-3 w-3" />
                </div>
              ) : (
                `/ ${max_responses}`
              )}
            </span>
          </div>
        </div>

        {!isUnlimited && (
          <div className="space-y-2">
            <Progress 
              value={progressValue} 
              className="h-2"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{response_count} received</span>
              <span>{max_responses - response_count} remaining</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Badge 
            variant={hasReachedLimit ? "destructive" : isUnlimited ? "default" : "secondary"}
            className="text-xs"
          >
            {hasReachedLimit 
              ? "Limit Reached" 
              : isUnlimited 
                ? "Unlimited" 
                : "Accepting Responses"
            }
          </Badge>
          
          {hasReachedLimit && (
            <span className="text-xs text-destructive">
              No more responses accepted
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
